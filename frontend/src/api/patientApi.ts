import { notifications, pathway, peakForecasts, serviceResults } from '../mocks/data'
import type { Notification, PatientPathway, PeakHourForecast, ServiceResult, SymptomReport } from '../types'
import axiosClient, { mockDelay, USE_MOCK_API } from './axiosClient'

export interface PeakHourForecastResponse {
  forecast_days: number
  peak_threshold: number
  forecasts: PeakHourForecast[]
}

export const patientApi = {
  getPeakHours: async (): Promise<PeakHourForecast[]> => USE_MOCK_API ? mockDelay(peakForecasts) : (await axiosClient.get<PeakHourForecast[]>('/peak-hours')).data,
  getPeakHourForecast: async (days = 7): Promise<PeakHourForecastResponse> => {
    if (USE_MOCK_API) return mockDelay({ forecast_days: days, peak_threshold: 45, forecasts: peakForecasts.slice(0, days * 20) })
    return (await axiosClient.post<PeakHourForecastResponse>('/forecasts', { days })).data
  },
  getNotifications: async (): Promise<Notification[]> => mockDelay(notifications),
  checkin: async (payload: object): Promise<{ visitId: string; queueNumber: string }> => USE_MOCK_API ? mockDelay({ visitId: 'VIS-260718-042', queueNumber: 'A042' }, 650) : (await axiosClient.post('/checkins', payload)).data,
  submitSymptoms: async (visitId: string, payload: SymptomReport): Promise<void> => { if (USE_MOCK_API) return mockDelay(undefined, 500); await axiosClient.post(`/visits/${visitId}/symptoms`, payload) },
  getCurrentPathway: async (): Promise<PatientPathway> => USE_MOCK_API ? mockDelay(pathway) : (await axiosClient.get<PatientPathway>('/visits/current/pathway')).data,
  getPathway: async (visitId: string): Promise<PatientPathway> => USE_MOCK_API ? mockDelay({ ...pathway, visitId }) : (await axiosClient.get<PatientPathway>(`/visits/${visitId}/pathway`)).data,
  getResults: async (visitId: string): Promise<ServiceResult[]> => USE_MOCK_API ? mockDelay(serviceResults) : (await axiosClient.get<ServiceResult[]>(`/visits/${visitId}/results`)).data,
}
