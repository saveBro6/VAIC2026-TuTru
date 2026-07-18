import { rooms, routingRecommendation } from '../mocks/data'
import type { AIRecommendation, Room, SymptomReport } from '../types'
import axiosClient, { mockDelay, USE_MOCK_API } from './axiosClient'

export const aiApi = {
  symptomRouting: async (visitId: string, symptoms: SymptomReport): Promise<AIRecommendation> => USE_MOCK_API ? mockDelay(routingRecommendation, 1200) : (await axiosClient.post<AIRecommendation>('/ai/symptom-routing', { visitId, symptoms })).data,
  fastestRoom: async (payload: object): Promise<Room[]> => USE_MOCK_API ? mockDelay(rooms.filter((room) => room.status === 'OPEN')) : (await axiosClient.post<Room[]>('/ai/fastest-room', payload)).data,
}
