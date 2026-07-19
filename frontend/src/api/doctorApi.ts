import { pathway, queue, routingRecommendation } from '../mocks/data'
import type { AIRecommendation, ClinicalSpecialtyOption, DoctorQueueResponse, PatientPathway, Priority, QueueEntry, QueueEntryStatus, ServiceOrder } from '../types'
import axiosClient, { mockDelay, USE_MOCK_API } from './axiosClient'

export interface CreateOptimizedJourneyPayload {
  department_code: string
  identification_code: string
  patient_name: string
  priority?: Priority
  symptom_text?: string
}

export interface CreateOptimizedJourneyResponse {
  journey_id: string
  visit_id: string
  patient_token: string
  queue_number: string
  department_code: string
  department_name: string
  room_id: string | null
  room_name: string
}

const queueStatusToVisitStatus: Record<QueueEntryStatus, QueueEntry['status']> = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_SERVICE: 'IN_EXAMINATION',
  DONE: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'CANCELLED',
}

export const doctorApi = {
  getQueue: async (roomId?: string): Promise<DoctorQueueResponse> => {
    if (USE_MOCK_API) {
      const mockQueue = queue.map((item, index) => ({ ...item, queueEntryId: item.queueEntryId ?? `MOCK-QE-${index + 1}` }))
      return mockDelay({
        rooms: [{ id: 'MOCK-ROOM-1', name: 'Phòng khám Nội 201', floor: '2', department: 'Nội tổng hợp', specialty: 'Nội tổng hợp', waitingCount: mockQueue.length, estimatedWait: 18 }],
        selectedRoom: { id: 'MOCK-ROOM-1', name: 'Phòng khám Nội 201', floor: '2', department: 'Nội tổng hợp', specialty: 'Nội tổng hợp', waitingCount: mockQueue.length, estimatedWait: 18 },
        queue: mockQueue,
      })
    }

    return (await axiosClient.get<DoctorQueueResponse>('/doctor/queue', { params: { room_id: roomId } })).data
  },
  getClinicalSpecialties: async (): Promise<ClinicalSpecialtyOption[]> => {
    if (USE_MOCK_API) {
      return mockDelay([
        { id: 'SPEC-CARD-CONSULT', code: 'CARD', name: 'Tim mạch', departmentId: 'DEPT-CARD', departmentCode: 'CARD', departmentName: 'Khoa Tim mạch', suggestedRoomId: 'ROOM-CARD-201', suggestedRoomName: 'Phòng khám Tim mạch 201', estimatedWait: 14 },
        { id: 'SPEC-NEURO-CONSULT', code: 'NEURO', name: 'Thần kinh', departmentId: 'DEPT-NEURO', departmentCode: 'NEURO', departmentName: 'Khoa Thần kinh', suggestedRoomId: 'ROOM-NEURO-202', suggestedRoomName: 'Phòng khám Thần kinh 202', estimatedWait: 18 },
        { id: 'SPEC-RESP-CONSULT', code: 'RESP', name: 'Hô hấp', departmentId: 'DEPT-RESP', departmentCode: 'RESP', departmentName: 'Khoa Hô hấp', suggestedRoomId: 'ROOM-RESP-401', suggestedRoomName: 'Phòng khám Hô hấp 401', estimatedWait: 11 },
        { id: 'SPEC-GASTRO-CONSULT', code: 'GASTRO', name: 'Tiêu hóa - Gan mật', departmentId: 'DEPT-GASTRO', departmentCode: 'GASTRO', departmentName: 'Khoa Tiêu hóa', suggestedRoomId: 'ROOM-GASTRO-304', suggestedRoomName: 'Phòng khám Tiêu hóa - Gan mật 304', estimatedWait: 22 },
      ])
    }

    return (await axiosClient.get<ClinicalSpecialtyOption[]>('/doctor/clinical-specialties')).data
  },
  getVisit: async (visitId: string): Promise<{ queue: QueueEntry; pathway: PatientPathway; recommendation: AIRecommendation }> => USE_MOCK_API ? mockDelay({ queue: queue.find((q) => q.visitId === visitId) ?? queue[0]!, pathway, recommendation: routingRecommendation }) : (await axiosClient.get(`/doctor/visits/${visitId}`)).data,
  updatePriority: async (visitId: string, priority: Priority) => USE_MOCK_API ? mockDelay({ visitId, priority }) : (await axiosClient.patch(`/doctor/visits/${visitId}/priority`, { priority })).data,
  startVisit: async (visitId: string) => USE_MOCK_API ? mockDelay({ visitId, status: 'IN_EXAMINATION' }) : (await axiosClient.post(`/doctor/visits/${visitId}/start`)).data,
  createOrder: async (visitId: string, order: Omit<ServiceOrder, 'id' | 'status'>) => USE_MOCK_API ? mockDelay({ ...order, id: `ORD-${Date.now()}`, status: 'PENDING' }) : (await axiosClient.post(`/doctor/visits/${visitId}/orders`, order)).data,
  updateQueueStatus: async (queueEntryId: string, status: QueueEntryStatus) => {
    if (USE_MOCK_API) {
      const item = queue.find((entry) => entry.queueEntryId === queueEntryId)
      if (item) {
        item.queueStatus = status
        item.status = queueStatusToVisitStatus[status]
      }
      return mockDelay({ entry: { queueEntryId, status } })
    }

    return (await axiosClient.patch(`/doctor/queue/${queueEntryId}/status`, { status })).data
  },
  prescribeAndStartExam: async (queueEntryId: string, clinicSpecialities: string[]) => {
    if (USE_MOCK_API) {
      const item = queue.find((entry) => entry.queueEntryId === queueEntryId)
      if (item) {
        item.queueStatus = 'IN_SERVICE'
        item.status = 'IN_EXAMINATION'
      }
      return mockDelay({ accepted: true, background: { jobId: `MOCK-PRESC-${Date.now()}`, status: 'QUEUED' }, queueEntryId, selectedSpecialties: clinicSpecialities, entry: item })
    }

    return (await axiosClient.post(`/doctor/queue/${queueEntryId}/prescriptions`, { clinic_specialities: clinicSpecialities })).data
  },
  createOptimizedJourney: async (payload: CreateOptimizedJourneyPayload): Promise<CreateOptimizedJourneyResponse> => {
    if (USE_MOCK_API) {
      const visitId = `J-${Date.now()}`
      return mockDelay({ journey_id: visitId, visit_id: visitId, patient_token: `PT-${payload.identification_code}`, queue_number: 'A042', department_code: payload.department_code, department_name: routingRecommendation.department, room_id: null, room_name: routingRecommendation.room })
    }

    return (await axiosClient.post<CreateOptimizedJourneyResponse>('/routing/optimize-sequence', payload)).data
  },
  completeVisit: async (visitId: string) => USE_MOCK_API ? mockDelay({ visitId, status: 'COMPLETED' }) : (await axiosClient.post(`/doctor/visits/${visitId}/complete`)).data,
}
