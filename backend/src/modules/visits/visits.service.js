const prisma = require('../../lib/prisma');
const envConfig = require('../../config/env');

const WAIT_TIME_REQUEST_TIMEOUT_MS = 5000;

function buildWaitTimeUrl(journeyId) {
  return new globalThis.URL(
    `/api/v1/journeys/${encodeURIComponent(journeyId)}/estimate`,
    envConfig.waitTimeServiceUrl,
  ).toString();
}

function waitEstimateMinutes(stepEstimate) {
  const estimate = stepEstimate?.estimate;
  if (Number.isFinite(estimate?.ewt_p50_minutes) && estimate.ewt_p50_minutes > 0) {
    return estimate.ewt_p50_minutes;
  }

  const breakdown = stepEstimate?.wait_breakdown;
  const operationalWait =
    breakdown?.estimated_operational_wait_minutes ?? breakdown?.operational_wait_minutes;
  if (Number.isFinite(operationalWait) && operationalWait > 0) return operationalWait;

  return null;
}

function positiveNumber(value) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function getJourneyWaitEstimates(journeyId) {
  if (!envConfig.waitTimeServiceUrl) return new Map();

  const controller = new globalThis.AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), WAIT_TIME_REQUEST_TIMEOUT_MS);

  try {
    const headers = { Accept: 'application/json' };
    if (envConfig.waitTimeApiKey) headers['X-API-Key'] = envConfig.waitTimeApiKey;

    const response = await globalThis.fetch(buildWaitTimeUrl(journeyId), {
      headers,
      signal: controller.signal,
    });

    if (!response.ok) return new Map();

    const data = await response.json();
    return new Map((data.steps || []).map((step) => [step.task_id, step]));
  } catch {
    return new Map();
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function queueNumberLabel(value) {
  if (!value) return 'A---';
  return `A${String(value).padStart(3, '0')}`;
}

function taskTitle(task) {
  if (task.taskType === 'INITIAL_CONSULT') return 'Khám ban đầu';
  if (task.taskType === 'DIAGNOSTIC_SERVICE') return 'Dịch vụ cận lâm sàng';
  if (task.taskType === 'RETURN_REVIEW') return 'Bác sĩ đọc kết quả';
  return 'Bước khám';
}

function stepStatus(task, entry) {
  if (task.status === 'COMPLETED') return 'COMPLETED';
  if (task.status === 'CANCELLED' || task.status === 'SKIPPED') return 'CANCELLED';
  if (task.status === 'IN_SERVICE') return 'IN_PROGRESS';
  if (entry?.status === 'CALLED') return 'CALLED';
  if (!entry && ['PENDING', 'READY'].includes(task.status)) return 'PENDING';
  return 'WAITING';
}

function activeQueueEntry(task) {
  return task.queueEntries.find((entry) =>
    ['WAITING', 'CALLED', 'IN_SERVICE'].includes(entry.status),
  );
}

async function peopleAhead(entry) {
  if (!entry?.queueId) return 0;

  if (entry.queueNumber) {
    return prisma.patientQueueEntry.count({
      where: {
        queueId: entry.queueId,
        status: { in: ['WAITING', 'CALLED'] },
        queueNumber: { lt: entry.queueNumber },
      },
    });
  }

  return prisma.patientQueueEntry.count({
    where: {
      queueId: entry.queueId,
      status: { in: ['WAITING', 'CALLED'] },
      enqueuedAt: { lt: entry.enqueuedAt },
    },
  });
}

function taskRoomLabel(task) {
  return task.room?.name || task.queue?.name || task.department?.name || 'Đang phân phòng';
}

function taskDirections(task) {
  if (task.room?.floor) return task.room.floor;
  if (task.department?.name) return task.department.name;
  return 'Nhân viên sẽ hướng dẫn tại quầy';
}

async function getPathway(visitId) {
  const journey = await prisma.patientJourney.findUnique({
    where: { id: visitId },
    include: {
      tasks: {
        include: {
          department: true,
          specialty: true,
          room: { include: { doctor: true } },
          queue: true,
          queueEntries: { orderBy: [{ position: 'asc' }, { enqueuedAt: 'asc' }] },
        },
        orderBy: [{ sequenceOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!journey) {
    const error = new Error('Journey not found');
    error.statusCode = 404;
    throw error;
  }

  const activeTask =
    journey.tasks.find((task) => activeQueueEntry(task)) ||
    journey.tasks.find((task) => !['COMPLETED', 'CANCELLED', 'SKIPPED'].includes(task.status)) ||
    journey.tasks[journey.tasks.length - 1];
  const activeEntry = activeTask ? activeQueueEntry(activeTask) || null : null;
  const ahead = await peopleAhead(activeEntry);
  const waitEstimatesByTaskId = await getJourneyWaitEstimates(journey.id);
  const queue = activeTask?.queue || null;
  const activeTaskWaitEstimate = waitEstimateMinutes(waitEstimatesByTaskId.get(activeTask?.id));
  const estimatedWait = Math.max(
    activeTaskWaitEstimate ?? positiveNumber(queue?.estimatedWaitMinutes) ?? ahead * 8,
    0,
  );
  const queueNumber = queueNumberLabel(activeEntry?.queueNumber);
  const allDone =
    journey.tasks.length > 0 &&
    journey.tasks.every((task) => ['COMPLETED', 'CANCELLED', 'SKIPPED'].includes(task.status));

  return {
    visitId: journey.id,
    visitStatus: allDone ? 'COMPLETED' : 'WAITING',
    queueNumber,
    currentRoom: activeTask ? taskRoomLabel(activeTask) : 'Đang phân phòng',
    peopleAhead: ahead,
    estimatedWait: Math.round(estimatedWait),
    steps: journey.tasks.map((task, index) => {
      const entry = activeQueueEntry(task) || task.queueEntries[0] || null;
      const waitEstimate = waitEstimateMinutes(waitEstimatesByTaskId.get(task.id));
      const status = stepStatus(task, entry);
      const fallbackWait =
        status === 'COMPLETED' ? 0 : task.id === activeTask?.id ? estimatedWait : index * 5;
      const waitMinutes = Math.max(
        waitEstimate ?? positiveNumber(task.queue?.estimatedWaitMinutes) ?? fallbackWait,
        0,
      );

      return {
        id: task.id,
        title: taskTitle(task),
        department: task.department?.name || 'Chưa xác định khoa',
        room: taskRoomLabel(task),
        doctor: task.room?.doctor?.fullName || undefined,
        status,
        estimatedWait: Math.round(waitMinutes),
        estimatedStart: new Date(Date.now() + waitMinutes * 60000).toISOString(),
        actualTime: task.completedAt?.toISOString(),
        directions: taskDirections(task),
      };
    }),
  };
}

async function getCurrentPatientPathway(auth) {
  if (auth?.role !== 'PATIENT' || !auth.patient_token) {
    const error = new Error('Patient token is required');
    error.statusCode = 403;
    throw error;
  }

  const activeJourney = await prisma.patientJourney.findFirst({
    where: {
      patientToken: auth.patient_token,
      tasks: {
        some: {
          status: { notIn: ['COMPLETED', 'CANCELLED', 'SKIPPED'] },
        },
      },
    },
    orderBy: [{ checkinAt: 'desc' }, { createdAt: 'desc' }],
  });

  const journey =
    activeJourney ||
    (await prisma.patientJourney.findFirst({
      where: { patientToken: auth.patient_token },
      orderBy: [{ checkinAt: 'desc' }, { createdAt: 'desc' }],
    }));

  if (!journey) {
    const error = new Error('No journey found for current patient');
    error.statusCode = 404;
    throw error;
  }

  return getPathway(journey.id);
}

module.exports = {
  getCurrentPatientPathway,
  getPathway,
};
