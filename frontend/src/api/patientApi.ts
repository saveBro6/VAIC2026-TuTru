import { notifications, pathway, peakForecasts, serviceResults } from '../mocks/data'
import type { Notification, PatientPathway, PeakHourForecast, ServiceResult, SymptomReport } from '../types'
import axiosClient, { mockDelay, USE_MOCK_API } from './axiosClient'

export const patientApi = {
  getPeakHours: async (): Promise<PeakHourForecast[]> => USE_MOCK_API ? mockDelay(peakForecasts) : (await axiosClient.get<PeakHourForecast[]>('/peak-hours')).data,
  getNotifications: async (): Promise<Notification[]> => mockDelay(notifications),
  checkin: async (payload: object): Promise<{ visitId: string; queueNumber: string }> => USE_MOCK_API ? mockDelay({ visitId: 'VIS-260718-042', queueNumber: 'A042' }, 650) : (await axiosClient.post('/checkins', payload)).data,
  submitSymptoms: async (visitId: string, payload: SymptomReport): Promise<void> => { if (USE_MOCK_API) return mockDelay(undefined, 500); await axiosClient.post(`/visits/${visitId}/symptoms`, payload) },
  getPathway: async (visitId: string): Promise<PatientPathway> => USE_MOCK_API ? mockDelay({ ...pathway, visitId }) : (await axiosClient.get<PatientPathway>(`/visits/${visitId}/pathway`)).data,
  getResults: async (visitId: string): Promise<ServiceResult[]> => USE_MOCK_API ? mockDelay(serviceResults) : (await axiosClient.get<ServiceResult[]>(`/visits/${visitId}/results`)).data,
}
