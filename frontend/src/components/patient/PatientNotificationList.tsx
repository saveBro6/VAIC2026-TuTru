import { Bell } from 'lucide-react'
import type { Notification } from '../../types'
import { timeAgo } from '../../utils/date'
export function PatientNotificationList({ items }: { items: Notification[] }) { return <div className="card"><h2 className="section-title"><Bell size={20}/>Thông báo mới</h2><div className="mt-4 divide-y divide-slate-100">{items.map((item) => <div key={item.id} className="py-3"><div className="flex items-start justify-between gap-3"><p className="font-bold text-slate-800">{item.title}</p>{!item.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-500"/>}</div><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-1 text-xs text-slate-400">{timeAgo(item.createdAt)}</p></div>)}</div></div> }
