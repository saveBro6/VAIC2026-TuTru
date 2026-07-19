import { notifications, pathway, peakForecasts, serviceResults } from '../mocks/data'
import type { Notification, PatientPathway, PeakHourForecast, ServiceResult, SymptomReport } from '../types'
import axiosClient, { mockDelay, USE_MOCK_API } from './axiosClient'

export interface PeakHourForecastResponse {
  forecast_days: number
  forecast_date?: string | null
  peak_threshold: number
  forecasts: PeakHourForecast[]
}

type PeakHourForecastRequest = number | { days?: number; date?: string }

export const patientApi = {
  getPeakHours: async (): Promise<PeakHourForecast[]> => USE_MOCK_API ? mockDelay(peakForecasts) : (await axiosClient.get<PeakHourForecast[]>('/peak-hours')).data,
  getPeakHourForecast: async (request: PeakHourForecastRequest = 7): Promise<PeakHourForecastResponse> => {
    const payload = typeof request === 'number' ? { days: request } : request
    const days = payload.days ?? 1
    if (USE_MOCK_API) return mockDelay({ forecast_days: days, forecast_date: payload.date ?? null, peak_threshold: 45, forecasts: peakForecasts.slice(0, days * 20) })
    return (await axiosClient.post<PeakHourForecastResponse>('/forecasts', payload)).data
  },
  getNotifications: async (): Promise<Notification[]> => mockDelay(notifications),
  checkin: async (payload: object): Promise<{ visitId: string; queueNumber: string }> => USE_MOCK_API ? mockDelay({ visitId: 'VIS-260718-042', queueNumber: 'A042' }, 650) : (await axiosClient.post('/checkins', payload)).data,
  submitSymptoms: async (visitId: string, payload: SymptomReport): Promise<void> => { if (USE_MOCK_API) return mockDelay(undefined, 500); await axiosClient.post(`/visits/${visitId}/symptoms`, payload) },
  getCurrentPathway: async (): Promise<PatientPathway> => USE_MOCK_API ? mockDelay(pathway) : (await axiosClient.get<PatientPathway>('/visits/current/pathway')).data,
  getPathway: async (visitId: string): Promise<PatientPathway> => USE_MOCK_API ? mockDelay({ ...pathway, visitId }) : (await axiosClient.get<PatientPathway>(`/visits/${visitId}/pathway`)).data,
  getResults: async (visitId: string): Promise<ServiceResult[]> => USE_MOCK_API ? mockDelay(serviceResults) : (await axiosClient.get<ServiceResult[]>(`/visits/${visitId}/results`)).data,
}
