import type { ReactNode } from 'react'
import { Badge as UiBadge } from '../ui/badge'
export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) { return <UiBadge className={className}>{children}</UiBadge> }
