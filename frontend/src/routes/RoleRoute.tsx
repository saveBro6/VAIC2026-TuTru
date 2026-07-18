import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import type { UserRole } from '../types'
export function RoleRoute({ role, children }: { role: UserRole; children: ReactNode }) { const user = useAuthStore((s) => s.user); return user?.role === role ? children : <Navigate to={user ? `/${user.role.toLowerCase()}` : '/login'} replace/> }
