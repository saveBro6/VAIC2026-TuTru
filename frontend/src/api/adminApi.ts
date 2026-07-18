import { doctors, liveVisits, peakForecasts, rooms } from '../mocks/data'
import type { Doctor, PatientVisit, PeakHourForecast, Room } from '../types'
import axiosClient, { mockDelay, USE_MOCK_API } from './axiosClient'

export interface AdminDashboardData { visits: PatientVisit[]; rooms: Room[]; doctors: Doctor[]; forecasts: PeakHourForecast[] }
export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardData> => USE_MOCK_API ? mockDelay({ visits: liveVisits, rooms, doctors, forecasts: peakForecasts }) : (await axiosClient.get<AdminDashboardData>('/admin/dashboard')).data,
  getLiveVisits: async (): Promise<PatientVisit[]> => USE_MOCK_API ? mockDelay(liveVisits) : (await axiosClient.get<PatientVisit[]>('/admin/live-visits')).data,
  getRooms: async (): Promise<Room[]> => USE_MOCK_API ? mockDelay(rooms) : (await axiosClient.get<Room[]>('/admin/rooms')).data,
  getDoctors: async (): Promise<Doctor[]> => USE_MOCK_API ? mockDelay(doctors) : (await axiosClient.get<Doctor[]>('/admin/doctors')).data,
  updateRoomStatus: async (roomId: string, status: Room['status']) => {
    if (!USE_MOCK_API) return (await axiosClient.patch(`/admin/rooms/${roomId}/status`, { status })).data
    const room = rooms.find((item) => item.id === roomId)
    if (room) room.status = status
    return mockDelay({ roomId, status })
  },
}
