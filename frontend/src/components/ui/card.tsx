import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('rounded-2xl border border-border/80 bg-card text-card-foreground shadow-[0_1px_2px_rgba(15,23,42,.03),0_8px_24px_rgba(15,23,42,.04)]', className)} {...props}/>
export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col gap-1.5 p-6 pb-3', className)} {...props}/>
export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn('text-lg font-bold tracking-tight text-foreground', className)} {...props}/>
export const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => <p className={cn('text-sm leading-6 text-muted-foreground', className)} {...props}/>
export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('p-6 pt-3', className)} {...props}/>
export const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('flex items-center p-6 pt-3', className)} {...props}/>
