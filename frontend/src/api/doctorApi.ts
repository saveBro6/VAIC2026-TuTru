import { pathway, queue, routingRecommendation } from '../mocks/data'
import type { AIRecommendation, DoctorQueueResponse, PatientPathway, Priority, QueueEntry, QueueEntryStatus, ServiceOrder } from '../types'
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
  getVisit: async (visitId: string): Promise<{ queue: QueueEntry; pathway: PatientPathway; recommendation: AIRecommendation }> => USE_MOCK_API ? mockDelay({ queue: queue.find((q) => q.visitId === visitId) ?? queue[0]!, pathway, recommendation: routingRecommendation }) : (await axiosClient.get(`/doctor/visits/${visitId}`)).data,
  updatePriority: async (visitId: string, priority: Priority) => USE_MOCK_API ? mockDelay({ visitId, priority }) : (await axiosClient.patch(`/doctor/visits/${visitId}/priority`, { priority })).data,
  startVisit: async (visitId: string) => USE_MOCK_API ? mockDelay({ visitId, status: 'IN_EXAMINATION' }) : (await axiosClient.post(`/doctor/visits/${visitId}/start`)).data,
  createOrder: async (visitId: string, order: Omit<ServiceOrder, 'id' | 'status'>) => USE_MOCK_API ? mockDelay({ ...order, id: `ORD-${Date.now()}`, status: 'PENDING' }) : (await axiosClient.post(`/doctor/visits/${visitId}/orders`, order)).data,
  updateQueueStatus: async (queueEntryId: string, status: QueueEntryStatus) => USE_MOCK_API ? mockDelay({ entry: { queueEntryId, status } }) : (await axiosClient.patch(`/doctor/queue/${queueEntryId}/status`, { status })).data,
  createOptimizedJourney: async (payload: CreateOptimizedJourneyPayload): Promise<CreateOptimizedJourneyResponse> => {
    if (USE_MOCK_API) {
      const visitId = `J-${Date.now()}`
      return mockDelay({ journey_id: visitId, visit_id: visitId, patient_token: `PT-${payload.identification_code}`, queue_number: 'A042', department_code: payload.department_code, department_name: routingRecommendation.department, room_id: null, room_name: routingRecommendation.room })
    }

    return (await axiosClient.post<CreateOptimizedJourneyResponse>('/routing/optimize-sequence', payload)).data
  },
  completeVisit: async (visitId: string) => USE_MOCK_API ? mockDelay({ visitId, status: 'COMPLETED' }) : (await axiosClient.post(`/doctor/visits/${visitId}/complete`)).data,
}
