import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '../../types'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
export function AppLayout({ role }: { role: UserRole }) { const [open, setOpen] = useState(false); const location = useLocation(); return <div className="min-h-screen bg-background"><AppSidebar role={role} open={open} onClose={() => setOpen(false)}/><div className="min-h-screen lg:pl-[276px]"><AppHeader onMenu={() => setOpen(true)}/><main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><AnimatePresence mode="wait"><motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .22, ease: 'easeOut' }}><Outlet/></motion.div></AnimatePresence></main></div></div> }
