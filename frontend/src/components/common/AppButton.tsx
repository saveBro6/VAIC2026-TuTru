import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Button } from '../ui/button'
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { children: ReactNode; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; loading?: boolean }
export function AppButton({ children, variant = 'primary', loading, disabled, ...props }: Props) { const mapped = { primary: 'default', secondary: 'secondary', danger: 'destructive', ghost: 'ghost' } as const; return <Button variant={mapped[variant]} disabled={disabled || loading} {...props}>{loading && <LoaderCircle className="animate-spin"/>}{children}</Button> }
