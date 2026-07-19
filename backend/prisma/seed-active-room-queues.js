const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ quiet: true });

const PROTECTED_IDENTIFICATION_CODE = '000000000001';
const MIN_ACTIVE_PATIENTS_PER_ROOM = 5;
const ACTIVE_QUEUE_STATUSES = ['WAITING', 'CALLED', 'IN_SERVICE'];
const PRIORITIES = ['NORMAL', 'NORMAL', 'NORMAL', 'URGENT', 'NON_URGENT'];
const BASE_CHECKIN_TIME = new Date('2026-07-19T01:00:00.000Z');
const PROVINCE_CODES = ['001', '031', '048', '079', '092', '075', '089', '024', '046', '066'];
const VIETNAMESE_PATIENT_NAMES = [
  'Nguyễn Văn Minh',
  'Trần Thị Hương',
  'Lê Hoàng Anh',
  'Phạm Thị Thu Hà',
  'Hoàng Gia Bảo',
  'Võ Thị Mỹ Linh',
  'Đặng Quốc Huy',
  'Bùi Thanh Tùng',
  'Đỗ Ngọc Anh',
  'Ngô Minh Khang',
  'Huỳnh Thảo Nhi',
  'Phan Đức Long',
  'Vũ Thị Lan Anh',
  'Mai Quang Dũng',
  'Đinh Nhật Nam',
  'Tạ Phương Uyên',
  'Cao Minh Đức',
  'Lý Thanh Trúc',
  'Hồ Anh Tuấn',
  'Dương Khánh Vy',
];

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function compactId(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
}

function hashNumber(value) {
  return [...String(value)].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) % 1000000,
    0,
  );
}

function roomSeedNumber(room, position) {
  return (hashNumber(room.code || room.id) + position * 7919) % 100000;
}

function realisticIdentificationCode(room, position, birthYear, genderDigit) {
  const seed = roomSeedNumber(room, position);
  const provinceCode = PROVINCE_CODES[seed % PROVINCE_CODES.length];
  const sequence = String((seed * 37 + position) % 1000000).padStart(6, '0');

  return `${provinceCode}${genderDigit}${String(birthYear).slice(-2)}${sequence}`;
}

function realisticPhoneNumber(room, position) {
  const prefixes = ['090', '091', '093', '094', '096', '097', '098', '032', '033', '034'];
  const seed = roomSeedNumber(room, position);
  const suffix = String((seed * 53 + position * 17) % 10000000).padStart(7, '0');

  return `${prefixes[seed % prefixes.length]}${suffix}`;
}

function patientSeedFor(room, position) {
  const seed = roomSeedNumber(room, position);
  const serial = String(seed).padStart(5, '0');
  const birthYear = 1965 + (seed % 42);
  const birthMonth = (seed % 12) + 1;
  const birthDay = (seed % 27) + 1;
  const name = VIETNAMESE_PATIENT_NAMES[seed % VIETNAMESE_PATIENT_NAMES.length];
  const femaleNameEndings = ['Hương', 'Hà', 'Linh', 'Anh', 'Nhi', 'Uyên', 'Trúc', 'Vy'];
  const genderDigit =
    name.includes('Thị') || femaleNameEndings.some((part) => name.endsWith(part)) ? 2 : 0;

  return {
    identificationCode: realisticIdentificationCode(room, position, birthYear, genderDigit),
    patientToken: `BN-20260719-${serial}`,
    fullName: name,
    phoneNumber: realisticPhoneNumber(room, position),
    dateOfBirth: new Date(
      `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}T00:00:00.000Z`,
    ),
  };
}

async function ensureConsultQueue(prisma, room) {
  const existingQueue = await prisma.serviceQueue.findFirst({
    where: { roomId: room.id, serviceType: 'CLINICAL_CONSULT', isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  if (existingQueue) return existingQueue;

  const id = `QUEUE-${room.id}-CLINICAL_CONSULT`;
  return prisma.serviceQueue.upsert({
    where: { id },
    create: {
      id,
      name: `Hàng đợi ${room.name}`,
      roomId: room.id,
      serviceType: 'CLINICAL_CONSULT',
      isActive: true,
      estimatedWaitMinutes: 0,
    },
    update: {
      name: `Hàng đợi ${room.name}`,
      roomId: room.id,
      serviceType: 'CLINICAL_CONSULT',
      isActive: true,
    },
  });
}

async function nextQueueNumber(prisma, queueId) {
  const aggregate = await prisma.patientQueueEntry.aggregate({
    where: { queueId },
    _max: { queueNumber: true },
  });

  return (aggregate._max.queueNumber || 0) + 1;
}

async function recomputeWaitingPositions(prisma, queueId) {
  const entries = await prisma.patientQueueEntry.findMany({
    where: { queueId, status: 'WAITING' },
    orderBy: [{ enqueuedAt: 'asc' }, { queueNumber: 'asc' }],
  });

  await Promise.all(
    entries.map((entry, index) =>
      prisma.patientQueueEntry.update({
        where: { id: entry.id },
        data: { position: index + 1 },
      }),
    ),
  );
}

async function activePatientCountForRoom(prisma, roomId) {
  const entries = await prisma.patientQueueEntry.findMany({
    where: {
      status: { in: ACTIVE_QUEUE_STATUSES },
      queue: { roomId },
      task: {
        patient: {
          NOT: [
            { identificationCode: PROTECTED_IDENTIFICATION_CODE },
            { identificationCode: { startsWith: 'SEED-' } },
            { patientToken: { startsWith: 'PT-SEED-' } },
          ],
        },
      },
    },
    select: {
      task: {
        select: {
          patientToken: true,
        },
      },
    },
  });

  return new Set(entries.map((entry) => entry.task.patientToken)).size;
}

async function patientHasActiveQueue(prisma, patientToken) {
  const activeEntry = await prisma.patientQueueEntry.findFirst({
    where: {
      status: { in: ACTIVE_QUEUE_STATUSES },
      task: { patientToken },
    },
    select: { id: true },
  });

  return Boolean(activeEntry);
}

async function deactivateLegacySeedData(prisma) {
  const now = new Date();

  await prisma.patientQueueEntry.updateMany({
    where: {
      status: { in: ACTIVE_QUEUE_STATUSES },
      task: {
        patient: {
          OR: [
            { identificationCode: { startsWith: 'SEED-' } },
            { patientToken: { startsWith: 'PT-SEED-' } },
          ],
        },
      },
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
    },
  });

  await prisma.patientJourneyTask.updateMany({
    where: {
      status: { in: ['PENDING', 'READY', 'IN_QUEUE', 'IN_SERVICE'] },
      patient: {
        OR: [
          { identificationCode: { startsWith: 'SEED-' } },
          { patientToken: { startsWith: 'PT-SEED-' } },
        ],
      },
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
    },
  });

  await prisma.patient.updateMany({
    where: {
      OR: [
        { identificationCode: { startsWith: 'SEED-' } },
        { patientToken: { startsWith: 'PT-SEED-' } },
      ],
    },
    data: { status: 'INACTIVE' },
  });
}

async function seedOnePatientInRoom(prisma, room, queue, positionInRoom) {
  const patientSeed = patientSeedFor(room, positionInRoom);
  const activeAlready = await patientHasActiveQueue(prisma, patientSeed.patientToken);

  if (activeAlready) {
    return { created: false, skipped: true, patientToken: patientSeed.patientToken };
  }

  const now = addMinutes(BASE_CHECKIN_TIME, positionInRoom * 7);
  const queueNumber = await nextQueueNumber(prisma, queue.id);
  const priority = PRIORITIES[(positionInRoom - 1) % PRIORITIES.length];
  const journeyId = `J-SEED-${compactId(room.id)}-${String(positionInRoom).padStart(2, '0')}`;
  const taskId = `T-SEED-${compactId(room.id)}-${String(positionInRoom).padStart(2, '0')}`;
  const entryId = `QE-SEED-${compactId(room.id)}-${String(positionInRoom).padStart(2, '0')}`;

  await prisma.patient.upsert({
    where: { patientToken: patientSeed.patientToken },
    create: {
      identificationCode: patientSeed.identificationCode,
      patientToken: patientSeed.patientToken,
      fullName: patientSeed.fullName,
      phoneNumber: patientSeed.phoneNumber,
      dateOfBirth: patientSeed.dateOfBirth,
      status: 'ACTIVE',
    },
    update: {
      identificationCode: patientSeed.identificationCode,
      fullName: patientSeed.fullName,
      phoneNumber: patientSeed.phoneNumber,
      dateOfBirth: patientSeed.dateOfBirth,
      status: 'ACTIVE',
    },
  });

  await prisma.patientJourney.upsert({
    where: { id: journeyId },
    create: {
      id: journeyId,
      patientToken: patientSeed.patientToken,
      checkinAt: now,
      severityScore: priority === 'URGENT' ? 50 : 10,
    },
    update: {
      patientToken: patientSeed.patientToken,
      checkinAt: now,
      severityScore: priority === 'URGENT' ? 50 : 10,
    },
  });

  await prisma.patientJourneyTask.upsert({
    where: { id: taskId },
    create: {
      id: taskId,
      journeyId,
      journeyStep: 'INITIAL_CONSULT',
      patientToken: patientSeed.patientToken,
      departmentId: room.specialty.departmentId,
      specialtyId: room.specialtyId,
      queueId: queue.id,
      roomId: room.id,
      taskType: 'INITIAL_CONSULT',
      status: 'IN_QUEUE',
      serviceType: 'CLINICAL_CONSULT',
      clinicalPriority: priority,
      readinessStatus: 'COMPLETED',
      schedulingMode: 'FAIR_QUEUE',
      doctorId: room.doctorId,
      assignedAt: now,
      arrivalTime: now,
      readyAt: now,
      sequenceOrder: 1,
      queueLength: Math.max(queueNumber - 1, 0),
      resourceStatus: 'AVAILABLE',
      caseComplexity: 'NORMAL',
    },
    update: {
      journeyId,
      journeyStep: 'INITIAL_CONSULT',
      patientToken: patientSeed.patientToken,
      departmentId: room.specialty.departmentId,
      specialtyId: room.specialtyId,
      queueId: queue.id,
      roomId: room.id,
      taskType: 'INITIAL_CONSULT',
      status: 'IN_QUEUE',
      serviceType: 'CLINICAL_CONSULT',
      clinicalPriority: priority,
      readinessStatus: 'COMPLETED',
      schedulingMode: 'FAIR_QUEUE',
      doctorId: room.doctorId,
      assignedAt: now,
      arrivalTime: now,
      readyAt: now,
      serviceStart: null,
      serviceEnd: null,
      completedAt: null,
      cancelledAt: null,
      sequenceOrder: 1,
      queueLength: Math.max(queueNumber - 1, 0),
      resourceStatus: 'AVAILABLE',
      caseComplexity: 'NORMAL',
      noShow: false,
    },
  });

  await prisma.patientQueueEntry.upsert({
    where: {
      taskId_queueId: {
        taskId,
        queueId: queue.id,
      },
    },
    create: {
      id: entryId,
      queueId: queue.id,
      taskId,
      status: 'WAITING',
      priority,
      queueNumber,
      position: queueNumber,
      enqueuedAt: now,
    },
    update: {
      status: 'WAITING',
      priority,
      queueNumber,
      position: queueNumber,
      enqueuedAt: now,
      calledAt: null,
      serviceStartAt: null,
      serviceEndAt: null,
      cancelledAt: null,
    },
  });

  return { created: true, skipped: false, patientToken: patientSeed.patientToken };
}

async function seedActiveRoomQueues() {
  const databaseUrl = 'postgresql://neondb_owner:npg_2JUga9sbVFcz@ep-falling-recipe-awd1tcj2.c-12.us-east-1.aws.neon.tech/neondb?sslmode=verify-full';
  if (!databaseUrl) throw new Error('DATABASE_URL is required to seed active room queues');

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    await deactivateLegacySeedData(prisma);

    const rooms = await prisma.clinicRoom.findMany({
      where: { isActive: true },
      include: {
        specialty: {
          include: {
            department: true,
          },
        },
      },
      orderBy: [{ floor: 'asc' }, { name: 'asc' }],
    });

    const summary = [];

    for (const room of rooms) {
      const queue = await ensureConsultQueue(prisma, room);
      const before = await activePatientCountForRoom(prisma, room.id);
      let created = 0;
      let skipped = 0;
      let seedPosition = 1;

      while (before + created < MIN_ACTIVE_PATIENTS_PER_ROOM) {
        const result = await seedOnePatientInRoom(prisma, room, queue, seedPosition);
        if (result.created) created += 1;
        if (result.skipped) skipped += 1;
        seedPosition += 1;

        if (seedPosition > 100) {
          throw new Error(`Unable to seed enough distinct patients for room ${room.id}`);
        }
      }

      await recomputeWaitingPositions(prisma, queue.id);
      const after = await activePatientCountForRoom(prisma, room.id);

      await prisma.serviceQueue.update({
        where: { id: queue.id },
        data: { estimatedWaitMinutes: after * 8 },
      });

      summary.push({
        roomId: room.id,
        queueId: queue.id,
        activeBefore: before,
        created,
        skipped,
        activeAfter: after,
      });
    }

    return {
      rooms: rooms.length,
      minActivePatientsPerRoom: MIN_ACTIVE_PATIENTS_PER_ROOM,
      protectedIdentificationCode: PROTECTED_IDENTIFICATION_CODE,
      totalCreated: summary.reduce((total, room) => total + room.created, 0),
      summary,
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (process.argv.includes('--dry-run')) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          minActivePatientsPerRoom: MIN_ACTIVE_PATIENTS_PER_ROOM,
          protectedIdentificationCode: PROTECTED_IDENTIFICATION_CODE,
        },
        null,
        2,
      ),
    );
    return;
  }

  const result = await seedActiveRoomQueues();
  console.log(JSON.stringify({ dryRun: false, ...result }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
