import type { AuthResponse, UserRole } from '../types'
import axiosClient, { mockDelay, USE_MOCK_API } from './axiosClient'

export const authApi = {
  login: async (identifier: string, password: string, demoRole?: UserRole): Promise<AuthResponse> => {
    if (!USE_MOCK_API) return (await axiosClient.post<AuthResponse>('/auth/login', { identifier, password })).data
    const role = demoRole ?? (identifier.includes('admin') ? 'ADMIN' : identifier.includes('doctor') ? 'DOCTOR' : 'PATIENT')
    return mockDelay({ access_token: `demo-${role.toLowerCase()}-token`, user: { id: `user-${role}`, full_name: role === 'PATIENT' ? 'Nguyễn Minh Quân' : role === 'DOCTOR' ? 'BS. Trần Minh An' : 'Quản trị bệnh viện', role, email: identifier } })
  },
}
