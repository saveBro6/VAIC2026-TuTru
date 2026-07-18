import { differenceInSeconds } from 'date-fns'
import { Download, Eye, FileCheck2, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import type { ServiceResult } from '../../types'
import { formatDateTime } from '../../utils/date'
import { AppButton } from '../common/AppButton'
import { Badge } from '../common/Badge'

const formatCountdown = (seconds: number) => `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
export function ResultPredictionCard({ result }: { result: ServiceResult }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, differenceInSeconds(new Date(result.estimatedAt), new Date())))
  useEffect(() => { const timer = window.setInterval(() => setRemaining(Math.max(0, differenceInSeconds(new Date(result.estimatedAt), new Date()))), 1000); return () => window.clearInterval(timer) }, [result.estimatedAt])
  const labels = { PENDING: 'Chờ thực hiện', PROCESSING: 'Đang xử lý', READY: 'Đã có kết quả' }
  return <div className="card"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex gap-3"><span className="icon-box"><FileCheck2/></span><div><h3 className="font-bold">{result.serviceName}</h3><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Timer size={14}/>Dự kiến: {formatDateTime(result.estimatedAt)}</p></div></div><Badge className={result.status === 'READY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>{labels[result.status]}</Badge></div>{result.status !== 'READY' && <div className="mt-4 rounded-xl bg-slate-950 p-4 text-white"><p className="text-xs uppercase tracking-wider text-slate-400">Thời gian dự kiến còn lại</p><p className="mt-1 font-mono text-3xl font-black tracking-widest">{remaining ? formatCountdown(remaining) : 'Đang cập nhật'}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full w-2/3 animate-pulse rounded-full bg-teal-400"/></div></div>}{result.status === 'READY' && result.doctorConfirmed && <div className="mt-4 flex flex-wrap gap-2"><AppButton onClick={() => toast.success(`Đang mở ${result.serviceName}`)}><Eye size={18}/>Xem chi tiết</AppButton><AppButton variant="secondary" onClick={() => toast.success('Đã chuẩn bị file kết quả')}><Download size={18}/>Tải file</AppButton></div>}{result.status === 'READY' && !result.doctorConfirmed && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">Kết quả đang chờ bác sĩ xác nhận trước khi hiển thị.</p>}</div>
}
