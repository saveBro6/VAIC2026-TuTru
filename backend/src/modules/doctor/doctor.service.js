const AppError = require('../../errors/app-error');
const prisma = require('../../lib/prisma');
const visitsService = require('../visits/visits.service');
const routingService = require('../routing/routing.service');

const QUEUE_STATUS_TO_VISIT_STATUS = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_SERVICE: 'IN_EXAMINATION',
  DONE: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'CANCELLED',
};

const QUEUE_STATUS_TO_TASK_STATUS = {
  WAITING: 'IN_QUEUE',
  CALLED: 'IN_QUEUE',
  IN_SERVICE: 'IN_SERVICE',
  DONE: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'SKIPPED',
};

const QUEUE_STATUSES = new Set(['WAITING', 'CALLED', 'IN_SERVICE', 'DONE', 'CANCELLED', 'NO_SHOW']);

function assertDoctor(auth) {
  if (!auth || !['DOCTOR', 'ADMIN'].includes(auth.role)) {
    throw new AppError('Doctor permission required', 403, 'FORBIDDEN');
  }
}

function canAccessRoom(auth, room) {
  return auth.role === 'ADMIN' || room?.doctorId === auth.sub;
}

function queueNumberLabel(value) {
  if (!value) return 'A---';
  return `A${String(value).padStart(3, '0')}`;
}

function minutesSince(value) {
  if (!value) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 0;
  const birth = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age -= 1;
  return Math.max(age, 0);
}

function mapPriorityForClient(priority) {
  return priority === 'NON_URGENT' ? 'NORMAL' : priority;
}

function mapQueueEntry(entry) {
  const task = entry.task;
  const patient = task.patient;
  const room = task.room || entry.queue.room;
  const department = task.department || room?.specialty?.department;

  return {
    queueEntryId: entry.id,
    taskId: task.id,
    visitId: task.journeyId,
    queueNumber: queueNumberLabel(entry.queueNumber),
    patientName: patient.fullName || patient.identificationCode || task.patientToken,
    age: calculateAge(patient.dateOfBirth),
    mainSymptom: task.serviceType === 'CLINICAL_CONSULT' ? 'Khám lâm sàng' : task.serviceType,
    priority: mapPriorityForClient(entry.priority),
    waitedMinutes: minutesSince(entry.enqueuedAt),
    status: QUEUE_STATUS_TO_VISIT_STATUS[entry.status] || 'WAITING',
    queueStatus: entry.status,
    department: department?.name || 'Chưa xác định khoa',
    room: room?.name || entry.queue.name,
  };
}

async function listDoctorRooms(auth) {
  assertDoctor(auth);

  const rooms = await prisma.clinicRoom.findMany({
    where: auth.role === 'ADMIN' ? { isActive: true } : { doctorId: auth.sub, isActive: true },
    include: {
      queues: {
        where: { isActive: true },
        include: {
          _count: {
            select: {
              entries: {
                where: { status: { in: ['WAITING', 'CALLED', 'IN_SERVICE'] } },
              },
            },
          },
        },
      },
      specialty: {
        include: {
          department: true,
        },
      },
    },
    orderBy: [{ floor: 'asc' }, { name: 'asc' }],
  });

  return rooms.map((room) => ({
    id: room.id,
    code: room.code,
    name: room.name,
    floor: room.floor,
    department: room.specialty.department.name,
    specialty: room.specialty.name,
    waitingCount: room.queues.reduce((total, queue) => total + queue._count.entries, 0),
    estimatedWait: Math.round(
      room.queues.reduce((total, queue) => total + queue.estimatedWaitMinutes, 0) /
        Math.max(room.queues.length, 1),
    ),
  }));
}

async function getDoctorQueue(auth, roomId) {
  const rooms = await listDoctorRooms(auth);
  if (rooms.length === 0) {
    return { rooms: [], selectedRoom: null, queue: [] };
  }

  const selectedRoom = roomId ? rooms.find((room) => room.id === roomId) : rooms[0];
  if (!selectedRoom) {
    throw new AppError('Clinic room is not assigned to this doctor', 403, 'FORBIDDEN');
  }

  const entries = await prisma.patientQueueEntry.findMany({
    where: {
      status: { in: ['WAITING', 'CALLED', 'IN_SERVICE'] },
      queue: { roomId: selectedRoom.id },
    },
    include: {
      queue: { include: { room: true } },
      task: {
        include: {
          patient: true,
          department: true,
          room: {
            include: {
              specialty: {
                include: {
                  department: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ position: 'asc' }, { queueNumber: 'asc' }, { enqueuedAt: 'asc' }],
  });

  return {
    rooms,
    selectedRoom,
    queue: entries.map(mapQueueEntry),
  };
}

async function findQueueEntryForDoctor(auth, entryId) {
  assertDoctor(auth);

  const entry = await prisma.patientQueueEntry.findUnique({
    where: { id: entryId },
    include: {
      queue: { include: { room: true } },
      task: {
        include: {
          patient: true,
          department: true,
          room: {
            include: {
              specialty: {
                include: {
                  department: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!entry) throw new AppError('Queue entry not found', 404, 'NOT_FOUND');
  if (!canAccessRoom(auth, entry.queue.room)) {
    throw new AppError('Clinic room is not assigned to this doctor', 403, 'FORBIDDEN');
  }

  return entry;
}

async function updateQueueEntryStatus(auth, entryId, status) {
  if (!QUEUE_STATUSES.has(status)) {
    throw new AppError('Invalid queue status', 400, 'INVALID_QUEUE_STATUS');
  }

  const current = await findQueueEntryForDoctor(auth, entryId);
  const now = new Date();
  const entryData = { status };
  const taskData = { status: QUEUE_STATUS_TO_TASK_STATUS[status] };

  if (status === 'CALLED') entryData.calledAt = now;
  if (status === 'IN_SERVICE') {
    entryData.serviceStartAt = now;
    taskData.serviceStart = now;
  }
  if (status === 'DONE') {
    entryData.serviceEndAt = now;
    taskData.serviceEnd = now;
    taskData.completedAt = now;
  }
  if (status === 'CANCELLED' || status === 'NO_SHOW') {
    entryData.cancelledAt = now;
    taskData.cancelledAt = now;
    if (status === 'NO_SHOW') taskData.noShow = true;
  }

  await prisma.patientQueueEntry.update({ where: { id: entryId }, data: entryData });
  await prisma.patientJourneyTask.update({ where: { id: current.taskId }, data: taskData });

  let nextActivation = null;
  if (status === 'DONE') {
    nextActivation = await routingService.activateNextTask({
      journeyId: current.task.journeyId,
      patientToken: current.task.patientToken,
    });
  }

  const updated = await findQueueEntryForDoctor(auth, entryId);
  return {
    entry: mapQueueEntry(updated),
    nextActivation,
  };
}

async function findActiveEntryByJourney(auth, journeyId) {
  assertDoctor(auth);

  const entry = await prisma.patientQueueEntry.findFirst({
    where: {
      status: { in: ['WAITING', 'CALLED', 'IN_SERVICE'] },
      task: { journeyId },
    },
    include: {
      queue: { include: { room: true } },
      task: {
        include: {
          patient: true,
          department: true,
          room: {
            include: {
              specialty: {
                include: {
                  department: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ position: 'asc' }, { enqueuedAt: 'asc' }],
  });

  if (!entry) throw new AppError('Active queue entry not found for journey', 404, 'NOT_FOUND');
  if (!canAccessRoom(auth, entry.queue.room)) {
    throw new AppError('Clinic room is not assigned to this doctor', 403, 'FORBIDDEN');
  }

  return entry;
}

async function getDoctorVisit(auth, journeyId) {
  const entry = await findActiveEntryByJourney(auth, journeyId);
  const pathway = await visitsService.getPathway(journeyId);

  return {
    queue: mapQueueEntry(entry),
    pathway,
    recommendation: {
      department: entry.task.department?.name || 'Chưa xác định khoa',
      departmentCode: entry.task.department?.code || entry.task.departmentId || undefined,
      room: entry.task.room?.name || entry.queue.name,
      floor: Number.parseInt(entry.task.room?.floor || '0', 10) || 0,
      estimatedWait: pathway.estimatedWait,
      waitingCount: pathway.peopleAhead,
      reason: 'Lộ trình hiện tại của bệnh nhân',
      confidence: 1,
      priority: mapPriorityForClient(entry.priority),
    },
  };
}

async function updateJourneyPriority(auth, journeyId, priority) {
  const entry = await findActiveEntryByJourney(auth, journeyId);
  const clinicalPriority = routingService.toClinicalPriority(priority);

  await prisma.patientQueueEntry.update({
    where: { id: entry.id },
    data: { priority: clinicalPriority },
  });
  await prisma.patientJourneyTask.updateMany({
    where: {
      journeyId,
      status: { notIn: ['COMPLETED', 'CANCELLED', 'SKIPPED'] },
    },
    data: { clinicalPriority },
  });

  return { visitId: journeyId, priority: clinicalPriority };
}

async function startVisit(auth, journeyId) {
  const entry = await findActiveEntryByJourney(auth, journeyId);
  return updateQueueEntryStatus(auth, entry.id, 'IN_SERVICE');
}

async function completeVisit(auth, journeyId) {
  const entry = await findActiveEntryByJourney(auth, journeyId);
  return updateQueueEntryStatus(auth, entry.id, 'DONE');
}

function normalizeOrder(order) {
  return {
    ...order,
    room_id: order.room_id || order.roomId || order.room || null,
    department_code:
      order.department_code ||
      order.departmentCode ||
      order.target_department ||
      order.targetDepartment ||
      null,
    priority: routingService.toClinicalPriority(order.priority),
    service_type: order.service_type || order.serviceType || order.type || 'CLINICAL_CONSULT',
  };
}

async function createOrders(auth, journeyId, payload) {
  await findActiveEntryByJourney(auth, journeyId);
  const orders = Array.isArray(payload.orders) ? payload.orders : [payload];
  const normalizedOrders = orders.map(normalizeOrder);

  if (normalizedOrders.some((order) => !order.room_id && !order.department_code)) {
    throw new AppError('Order target room or department is required', 400, 'INVALID_ORDER_TARGET');
  }

  return routingService.addJourneyTasks({ journeyId, orders: normalizedOrders });
}

module.exports = {
  getDoctorQueue,
  updateQueueEntryStatus,
  getDoctorVisit,
  updateJourneyPriority,
  startVisit,
  completeVisit,
  createOrders,
};
