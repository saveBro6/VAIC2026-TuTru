import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
export function AppModal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) { return <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>{children}</DialogContent></Dialog> }
