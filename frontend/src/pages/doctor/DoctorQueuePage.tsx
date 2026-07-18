import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { doctorApi } from '../../api/doctorApi'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { DoctorQueueTable } from '../../components/doctor/DoctorQueueTable'
import type { Priority, VisitStatus } from '../../types'
import { POLLING } from '../../utils/constants'

const PAGE_SIZE = 5
export function DoctorQueuePage() {
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState<Priority | 'ALL'>('ALL')
  const [status, setStatus] = useState<VisitStatus | 'ALL'>('ALL')
  const [wait, setWait] = useState('ALL')
  const [page, setPage] = useState(1)
  const query = useQuery({ queryKey: ['doctor-queue'], queryFn: doctorApi.getQueue, refetchInterval: POLLING.doctorQueue })
  const filtered = useMemo(() => (query.data ?? []).filter((item) => `${item.patientName} ${item.queueNumber} ${item.mainSymptom}`.toLowerCase().includes(search.toLowerCase()) && (priority === 'ALL' || item.priority === priority) && (status === 'ALL' || item.status === status) && (wait === 'ALL' || (wait === 'OVER_30' ? item.waitedMinutes >= 30 : item.waitedMinutes < 30))), [query.data, search, priority, status, wait])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return <><PageHeader title="Hàng đợi bệnh nhân" description={`Tự động cập nhật mỗi 10 giây · ${filtered.length} bệnh nhân`}/><div className="card mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_180px]"><label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={20}/><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Tên, số thứ tự, triệu chứng..." className="form-control pl-10"/></label><select value={priority} onChange={(e) => { setPriority(e.target.value as Priority | 'ALL'); setPage(1) }} className="form-control"><option value="ALL">Tất cả ưu tiên</option><option value="EMERGENCY">Cấp cứu</option><option value="URGENT">Khẩn cấp</option><option value="HIGH">Ưu tiên cao</option><option value="NORMAL">Bình thường</option></select><select value={status} onChange={(e) => { setStatus(e.target.value as VisitStatus | 'ALL'); setPage(1) }} className="form-control"><option value="ALL">Tất cả trạng thái</option><option value="WAITING">Đang chờ</option><option value="CALLED">Đã gọi</option></select><select value={wait} onChange={(e) => { setWait(e.target.value); setPage(1) }} className="form-control"><option value="ALL">Mọi thời gian chờ</option><option value="OVER_30">Trên 30 phút</option><option value="UNDER_30">Dưới 30 phút</option></select></div>{query.isLoading ? <LoadingSkeleton/> : visible.length ? <><DoctorQueueTable items={visible}/><Pagination page={page} totalPages={totalPages} totalItems={filtered.length} onChange={setPage}/></> : <EmptyState title="Không có bệnh nhân phù hợp" description="Thử thay đổi bộ lọc hàng đợi."/>}</>
}
