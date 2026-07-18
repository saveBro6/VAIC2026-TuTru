import type { Priority } from '../types'
export const priorityLabel: Record<Priority, string> = { EMERGENCY: 'Cấp cứu', URGENT: 'Khẩn cấp', HIGH: 'Ưu tiên cao', NORMAL: 'Bình thường', LOW: 'Ưu tiên thấp' }
export const priorityClass: Record<Priority, string> = { EMERGENCY: 'bg-red-700 text-white', URGENT: 'bg-red-100 text-red-800', HIGH: 'bg-orange-100 text-orange-800', NORMAL: 'bg-blue-100 text-blue-800', LOW: 'bg-slate-100 text-slate-700' }
