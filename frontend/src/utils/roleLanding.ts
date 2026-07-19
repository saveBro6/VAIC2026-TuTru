import type { UserRole } from '../types'

export function getRoleLandingPath(role: UserRole) {
  if (role === 'PATIENT') return '/patient'
  if (role === 'DOCTOR') return '/doctor/intake'
  return '/admin'
}
