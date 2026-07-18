import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export function DialogContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) { return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in"/><DialogPrimitive.Content className={cn('fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-border bg-card p-6 shadow-2xl outline-none', className)} {...props}>{children}<DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X size={18}/><span className="sr-only">Đóng</span></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal> }
export const DialogHeader = ({ className, ...props }: ComponentProps<'div'>) => <div className={cn('mb-5 space-y-1.5 pr-8', className)} {...props}/>
export const DialogTitle = ({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) => <DialogPrimitive.Title className={cn('text-xl font-bold tracking-tight text-foreground', className)} {...props}/>
export const DialogDescription = ({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) => <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props}/>
