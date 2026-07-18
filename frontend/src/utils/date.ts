import { format, formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
export const formatDateTime = (value: string | Date) => format(new Date(value), 'HH:mm, dd/MM/yyyy', { locale: vi })
export const formatTime = (value: string | Date) => format(new Date(value), 'HH:mm', { locale: vi })
export const timeAgo = (value: string | Date) => formatDistanceToNow(new Date(value), { addSuffix: true, locale: vi })
