const crypto = require('node:crypto');

const envConfig = require('../../config/env');
const prisma = require('../../lib/prisma');

// Clinical severity score mapping
const SEVERITY_SCORES = {
  EMERGENCY: 100,
  URGENT: 50,
  NORMAL: 10,
  NON_URGENT: 10,
};

// Priority ordering for resolving highest priority across tasks
const PRIORITY_ORDER = {
  EMERGENCY: 0,
  URGENT: 1,
  NORMAL: 2,
  NON_URGENT: 3,
};

const VALID_PRIORITIES = new Set(['EMERGENCY', 'URGENT', 'NORMAL', 'NON_URGENT']);
const AI_OPTIMIZE_SEQUENCE_PATH = '/api/v1/routing/optimize-sequence';
const AI_REQUEST_TIMEOUT_MS = 15000;

function buildAiUrl(path) {
  return new globalThis.URL(path, envConfig.aiServiceUrl).toString();
}

function compactToken(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function shortId() {
  return crypto.randomBytes(5).toString('hex');
}

function toClinicalPriority(priority) {
  if (priority === 'HIGH') return 'URGENT';
  return VALID_PRIORITIES.has(priority) ? priority : 'NORMAL';
}

async function findOrCreatePatient({ patientToken, identificationCode, fullName }) {
  const existingByIdentification = identificationCode
    ? await prisma.patient.findUnique({ where: { identificationCode } })
    : null;
  const existingPatient =
    existingByIdentification ||
    (patientToken ? await prisma.patient.findUnique({ where: { patientToken } }) : null);

  if (existingPatient) {
    return prisma.patient.update({
      where: { patientToken: existingPatient.patientToken },
      data: {
        fullName: fullName || existingPatient.fullName,
        status: 'ACTIVE',
      },
    });
  }

  return prisma.patient.create({
    data: {
      identificationCode: identificationCode || `AUTO-${patientToken}`,
      patientToken,
      fullName: fullName || null,
      status: 'ACTIVE',
    },
  });
}

async function findDepartmentTarget(departmentCode) {
  const department = await prisma.department.findFirst({
    where: {
      isActive: true,
      OR: [{ id: departmentCode }, { code: departmentCode }],
    },
    include: {
      specialties: {
        where: { isActive: true },
        include: {
          rooms: {
            where: { isActive: true },
            include: {
              queues: { where: { isActive: true } },
              doctor: true,
            },
          },
        },
      },
    },
  });

  if (!department) {
    const error = new Error(`Department not found or inactive: ${departmentCode}`);
    error.statusCode = 404;
    throw error;
  }

  const rooms = department.specialties.flatMap((specialty) =>
    specialty.rooms.map((room) => ({ ...room, specialty })),
  );
  const room = rooms
    .slice()
    .sort(
      (left, right) =>
        (left.queues[0]?.estimatedWaitMinutes ?? 0) - (right.queues[0]?.estimatedWaitMinutes ?? 0),
    )[0];
  const specialty = room?.specialty || department.specialties[0] || null;

  return { department, specialty, room: room || null };
}

async function ensureConsultQueue({ department, room }) {
  const existingQueue = room
    ? await prisma.serviceQueue.findFirst({
      where: { roomId: room.id, serviceType: 'CLINICAL_CONSULT', isActive: true },
    })
    : null;

  if (existingQueue) return existingQueue;

  const queueId = room
    ? `QUEUE-${room.id}-CLINICAL_CONSULT`
    : `QUEUE-${department.id}-CLINICAL_CONSULT`;

  return prisma.serviceQueue.upsert({
    where: { id: queueId },
    create: {
      id: queueId,
      name: room ? `Hàng đợi ${room.name}` : `Hàng đợi ${department.name}`,
      roomId: room?.id || null,
      serviceType: 'CLINICAL_CONSULT',
      isActive: true,
      estimatedWaitMinutes: 0,
    },
    update: {
      name: room ? `Hàng đợi ${room.name}` : `Hàng đợi ${department.name}`,
      roomId: room?.id || null,
      serviceType: 'CLINICAL_CONSULT',
      isActive: true,
    },
  });
}

async function nextQueueNumber(queueId) {
  const aggregate = await prisma.patientQueueEntry.aggregate({
    where: { queueId },
    _max: { queueNumber: true },
  });

  return (aggregate._max.queueNumber || 0) + 1;
}

async function applyOptimizationSequence(sequence) {
  console.log(sequence)
  await Promise.all(
    sequence.map((item) =>
      prisma.patientJourneyTask.update({
        where: { id: item.task_id },
        data: { sequenceOrder: item.sequence_order },
      })
    )
  );
}

async function optimizeSequenceWithAi({ clinicSpecialities, patientToken }) {
  const controller = new globalThis.AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await globalThis.fetch(buildAiUrl(AI_OPTIMIZE_SEQUENCE_PATH), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        clinic_specialities: clinicSpecialities,
        patient_token: patientToken,
      }),
      signal: controller.signal,
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { detail: await response.text() };

    if (!response.ok) {
      const error = new Error(data.detail || 'AI optimize-sequence request failed');
      error.statusCode = response.status;
      throw error;
    }

    await applyOptimizationSequence(data.optimal_sequence || []);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('AI optimize-sequence request timed out');
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    if (error.statusCode) throw error;
    const unavailableError = new Error(
      `Unable to reach AI optimize-sequence service: ${error.message}`
    );
    unavailableError.statusCode = 502;
    throw unavailableError;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

/**
 * Generates all permutations of an array.
 * Only suitable for small arrays (n <= 8).
 */
function generatePermutations(arr) {
  if (arr.length === 0) return [[]];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = generatePermutations(
      arr.slice(0, i).concat(arr.slice(i + 1))
    );
    for (const perm of rest) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

/**
 * Builds an adjacency list from hospital edge records.
 * Edges are treated as bidirectional.
 */
function buildGraph(edges) {
  const graph = {};
  for (const edge of edges) {
    if (!graph[edge.fromRoomId]) graph[edge.fromRoomId] = {};
    if (!graph[edge.toRoomId]) graph[edge.toRoomId] = {};
    graph[edge.fromRoomId][edge.toRoomId] = edge.travelMinutes;
    graph[edge.toRoomId][edge.fromRoomId] = edge.travelMinutes;
  }
  return graph;
}

/**
 * Dijkstra's shortest path algorithm.
 * Returns the shortest travel time between startNode and endNode.
 */
function shortestPath(graph, startNode, endNode) {
  if (startNode === endNode) return 0;
  if (!graph[startNode] || !graph[endNode]) return 999999;

  const distances = {};
  const visited = new Set();

  for (const node in graph) {
    distances[node] = Infinity;
  }
  distances[startNode] = 0;

  while (true) {
    let minNode = null;
    let minDistance = Infinity;

    for (const node in distances) {
      if (!visited.has(node) && distances[node] < minDistance) {
        minDistance = distances[node];
        minNode = node;
      }
    }

    if (minNode === null || minNode === endNode) break;

    visited.add(minNode);

    for (const neighbor in graph[minNode]) {
      const alt = distances[minNode] + graph[minNode][neighbor];
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
      }
    }
  }

  return distances[endNode] === Infinity ? 999999 : distances[endNode];
}

/**
 * Main optimisation function.
 *
 * Cost = 0.20 * T_norm + 0.30 * Q_norm + 0.50 * P_norm
 */
async function optimizeServiceSequence(journeyId, patientToken) {
  // 1. Fetch and validate journey
  const journey = await prisma.patientJourney.findFirst({
    where: { id: journeyId, patientToken },
  });

  if (!journey) {
    const error = new Error('Journey not found or patient_token mismatch');
    error.statusCode = 404;
    throw error;
  }

  // 2. Fetch pending tasks
  const pendingTasks = await prisma.patientJourneyTask.findMany({
    where: {
      journeyId,
      status: { in: ['PENDING', 'READY'] },
    },
  });

  if (pendingTasks.length === 0) {
    return {
      journey_id: journeyId,
      patient_token: patientToken,
      optimal_sequence: [],
      metrics: {
        total_cost: 0,
        travel_cost: 0,
        queue_cost: 0,
        priority_penalty: 0,
      },
    };
  }

  // 3. Fetch hospital graph
  const edges = await prisma.hospitalEdge.findMany();
  const graph = buildGraph(edges);

  // 4. Fetch equipment statuses (build set of inactive rooms)
  const equipments = await prisma.equipment.findMany();
  const inactiveRooms = new Set(
    equipments
      .filter((eq) => eq.status === 'INACTIVE' && eq.roomId)
      .map((eq) => eq.roomId)
  );

  // 5. Fetch queue wait times
  const queues = await prisma.serviceQueue.findMany({
    where: { isActive: true },
  });
  const queueByRoom = {};
  for (const q of queues) {
    if (q.roomId) {
      queueByRoom[q.roomId] = q.estimatedWaitMinutes || 0;
    }
  }

  // 6. Determine patient's current location
  const lastTask = await prisma.patientJourneyTask.findFirst({
    where: {
      journeyId,
      status: { in: ['IN_SERVICE', 'COMPLETED'] },
      roomId: { not: null },
    },
    orderBy: { completedAt: 'desc' },
  });
  const currentLocation = (lastTask && lastTask.roomId) || 'reception';

  // 7. Resolve highest clinical priority across tasks
  const clinicalPriority = pendingTasks.reduce((highest, task) => {
    const currentOrder = PRIORITY_ORDER[highest] ?? 99;
    const taskOrder = PRIORITY_ORDER[task.clinicalPriority] ?? 99;
    return taskOrder < currentOrder ? task.clinicalPriority : highest;
  }, 'NORMAL');

  // 8. Calculate priority penalty (constant for this patient)
  const checkinAt = journey.checkinAt ? new Date(journey.checkinAt) : null;
  const now = Date.now();
  const waitMinutes = checkinAt
    ? Math.max(0, (now - checkinAt.getTime()) / 60000)
    : 0;
  const cs = SEVERITY_SCORES[clinicalPriority] || 10;
  const ps = 1.0 * cs + 1.5 * waitMinutes;
  const pNorm = 1 - Math.min(ps / 200, 1);

  // 9. Generate permutations and evaluate
  const permutations = generatePermutations(pendingTasks);
  const candidates = [];

  for (const seq of permutations) {
    // Filter: skip sequences with any INACTIVE equipment room
    let hasInactive = false;
    for (const task of seq) {
      if (task.roomId && inactiveRooms.has(task.roomId)) {
        hasInactive = true;
        break;
      }
    }
    if (hasInactive) continue;

    // Calculate travel cost
    let T = 0;
    let prev = currentLocation;
    for (const task of seq) {
      if (task.roomId) {
        T += shortestPath(graph, prev, task.roomId);
        prev = task.roomId;
      }
    }

    // Calculate queue cost
    let Q = 0;
    for (const task of seq) {
      if (task.roomId) {
        Q += queueByRoom[task.roomId] || 0;
      }
    }

    candidates.push({ sequence: seq, T, Q });
  }

  if (candidates.length === 0) {
    const error = new Error(
      'No valid service sequences available (all blocked by inactive equipment)'
    );
    error.statusCode = 422;
    throw error;
  }

  // 10. Normalise and find minimum cost
  const maxT = Math.max(...candidates.map((c) => c.T), 1);
  const maxQ = Math.max(...candidates.map((c) => c.Q), 1);

  let bestCandidate = null;
  let minCost = Infinity;

  for (const candidate of candidates) {
    const tNorm = candidate.T / maxT;
    const qNorm = candidate.Q / maxQ;
    const cost = 0.2 * tNorm + 0.3 * qNorm + 0.5 * pNorm;

    if (cost < minCost) {
      minCost = cost;
      bestCandidate = candidate;
    }
  }

  // 11. Update sequenceOrder in DB
  const optimalSequence = bestCandidate.sequence.map((task, index) => ({
    task_id: task.id,
    service_type: task.serviceType,
    room_id: task.roomId,
    sequence_order: index + 1,
  }));

  await Promise.all(
    optimalSequence.map((item) =>
      prisma.patientJourneyTask.update({
        where: { id: item.task_id },
        data: { sequenceOrder: item.sequence_order },
      })
    )
  );

  return {
    journey_id: journeyId,
    patient_token: patientToken,
    optimal_sequence: optimalSequence,
    metrics: {
      total_cost: Math.round(minCost * 1e6) / 1e6,
      travel_cost: Math.round(bestCandidate.T * 100) / 100,
      queue_cost: Math.round(bestCandidate.Q * 100) / 100,
      priority_penalty: Math.round(pNorm * 1e6) / 1e6,
    },
  };
}

async function createJourneyAndOptimize(payload) {
  const departmentCode = payload.department_code || payload.departmentCode;
  const identificationCode = payload.identification_code || payload.identificationCode || null;
  const generatedTokenSource = identificationCode || shortId();
  const patientToken =
    payload.patient_token || payload.patientToken || `PT-${compactToken(generatedTokenSource)}`;
  const fullName = payload.patient_name || payload.patientName || null;
  const clinicalPriority = toClinicalPriority(payload.priority);
  const now = new Date();

  const patient = await findOrCreatePatient({
    patientToken,
    identificationCode,
    fullName,
  });
  const { department, specialty, room } = await findDepartmentTarget(departmentCode);
  if (!specialty) {
    const error = new Error(`No active clinical specialty found for department: ${departmentCode}`);
    error.statusCode = 422;
    throw error;
  }
  const queue = await ensureConsultQueue({ department, room });
  const queueNumber = await nextQueueNumber(queue.id);
  const journeyId = `J-${Date.now()}-${shortId()}`;
  const taskId = `T-${Date.now()}-${shortId()}`;

  await prisma.patientJourney.create({
    data: {
      id: journeyId,
      patientToken: patient.patientToken,
      checkinAt: now,
      severityScore: SEVERITY_SCORES[clinicalPriority] || SEVERITY_SCORES.NORMAL,
    },
  });

  await prisma.patientJourneyTask.create({
    data: {
      id: taskId,
      journeyId,
      journeyStep: 'INITIAL_CONSULT',
      patientToken: patient.patientToken,
      departmentId: department.id,
      specialtyId: specialty?.id || null,
      queueId: queue.id,
      roomId: room?.id || null,
      taskType: 'INITIAL_CONSULT',
      status: 'READY',
      serviceType: 'CLINICAL_CONSULT',
      clinicalPriority,
      readinessStatus: 'COMPLETED',
      schedulingMode: 'FAIR_QUEUE',
      doctorId: room?.doctorId || null,
      assignedAt: now,
      arrivalTime: now,
      readyAt: now,
      sequenceOrder: 1,
      queueLength: Math.max(queueNumber - 1, 0),
      resourceStatus: 'AVAILABLE',
      caseComplexity: 'NORMAL',
    },
  });

  await prisma.patientQueueEntry.create({
    data: {
      queueId: queue.id,
      taskId,
      status: 'WAITING',
      priority: clinicalPriority,
      queueNumber,
      position: queueNumber,
      enqueuedAt: now,
    },
  });

  const optimization = await optimizeSequenceWithAi({
    clinicSpecialities: [specialty.id],
    patientToken: patient.patientToken,
  });

  return {
    ...optimization,
    journey_id: journeyId,
    visit_id: journeyId,
    patient_token: patient.patientToken,
    queue_number: `A${String(queueNumber).padStart(3, '0')}`,
    department_code: department.code || department.id,
    department_name: department.name,
    room_id: room?.id || null,
    room_name: room?.name || queue.name,
  };
}

module.exports = {
  optimizeServiceSequence,
  optimizeSequenceWithAi,
  createJourneyAndOptimize,
};
