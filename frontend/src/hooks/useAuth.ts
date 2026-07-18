import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { useAuthStore } from '../stores/authStore'
import type { UserRole } from '../types'

export const useAuth = () => {
  const navigate = useNavigate()
  const { user, token, setAuth, logout: clearAuth } = useAuthStore()
  const login = useMutation({ mutationFn: ({ identifier, password, role }: { identifier: string; password: string; role?: UserRole }) => authApi.login(identifier, password, role), onSuccess: ({ access_token, user: nextUser }) => { setAuth(access_token, nextUser); navigate(`/${nextUser.role.toLowerCase()}`) } })
  const logout = () => { clearAuth(); navigate('/login') }
  return { user, token, login, logout, isAuthenticated: Boolean(token && user) }
}
