import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors', { variants: { variant: { default: 'border-transparent bg-primary/10 text-primary', secondary: 'border-transparent bg-muted text-muted-foreground', success: 'border-emerald-200 bg-emerald-50 text-emerald-700', warning: 'border-amber-200 bg-amber-50 text-amber-700', destructive: 'border-red-200 bg-red-50 text-red-700', outline: 'border-border text-foreground' } }, defaultVariants: { variant: 'default' } })
export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, variant, ...props }: BadgeProps) { return <div className={cn(badgeVariants({ variant }), className)} {...props}/> }
