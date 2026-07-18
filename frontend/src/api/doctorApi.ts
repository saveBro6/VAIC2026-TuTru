import { pathway, queue, routingRecommendation } from '../mocks/data'
import type { AIRecommendation, PatientPathway, Priority, QueueEntry, ServiceOrder } from '../types'
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
  getQueue: async (): Promise<QueueEntry[]> => USE_MOCK_API ? mockDelay(queue) : (await axiosClient.get<QueueEntry[]>('/doctor/queue')).data,
  getVisit: async (visitId: string): Promise<{ queue: QueueEntry; pathway: PatientPathway; recommendation: AIRecommendation }> => USE_MOCK_API ? mockDelay({ queue: queue.find((q) => q.visitId === visitId) ?? queue[0]!, pathway, recommendation: routingRecommendation }) : (await axiosClient.get(`/doctor/visits/${visitId}`)).data,
  updatePriority: async (visitId: string, priority: Priority) => USE_MOCK_API ? mockDelay({ visitId, priority }) : (await axiosClient.patch(`/doctor/visits/${visitId}/priority`, { priority })).data,
  startVisit: async (visitId: string) => USE_MOCK_API ? mockDelay({ visitId, status: 'IN_EXAMINATION' }) : (await axiosClient.post(`/doctor/visits/${visitId}/start`)).data,
  createOrder: async (visitId: string, order: Omit<ServiceOrder, 'id' | 'status'>) => USE_MOCK_API ? mockDelay({ ...order, id: `ORD-${Date.now()}`, status: 'PENDING' }) : (await axiosClient.post(`/doctor/visits/${visitId}/orders`, order)).data,
  createOptimizedJourney: async (payload: CreateOptimizedJourneyPayload): Promise<CreateOptimizedJourneyResponse> => {
    if (USE_MOCK_API) {
      const visitId = `J-${Date.now()}`
      return mockDelay({ journey_id: visitId, visit_id: visitId, patient_token: `PT-${payload.identification_code}`, queue_number: 'A042', department_code: payload.department_code, department_name: routingRecommendation.department, room_id: null, room_name: routingRecommendation.room })
    }

    return (await axiosClient.post<CreateOptimizedJourneyResponse>('/routing/optimize-sequence', payload)).data
  },
  completeVisit: async (visitId: string) => USE_MOCK_API ? mockDelay({ visitId, status: 'COMPLETED' }) : (await axiosClient.post(`/doctor/visits/${visitId}/complete`)).data,
}
