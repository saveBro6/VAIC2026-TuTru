import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { adminApi } from '../../api/adminApi'
import { LivePatientTable } from '../../components/admin/LivePatientTable'
import { VisitStatusFilter, type VisitFilters } from '../../components/admin/VisitStatusFilter'
import { AppModal } from '../../components/common/AppModal'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import type { PatientVisit } from '../../types'
import { formatDateTime } from '../../utils/date'
import { POLLING } from '../../utils/constants'

const initialFilters: VisitFilters = { search: '', status: 'ALL', priority: 'ALL', department: 'ALL' }
const PAGE_SIZE = 5
export function LivePatientManagementPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<PatientVisit | null>(null)
  const query = useQuery({ queryKey: ['admin-live-visits'], queryFn: adminApi.getLiveVisits, refetchInterval: POLLING.adminLive })
  const filtered = useMemo(() => (query.data ?? []).filter((visit) => {
    const keyword = `${visit.patientName} ${visit.patientId} ${visit.id} ${visit.queueNumber}`.toLowerCase()
    return keyword.includes(filters.search.toLowerCase()) && (filters.status === 'ALL' || visit.status === filters.status) && (filters.priority === 'ALL' || visit.priority === filters.priority) && (filters.department === 'ALL' || visit.department === filters.department)
  }), [query.data, filters])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const changeFilters = (next: VisitFilters) => { setFilters(next); setPage(1) }
  const resetFilters = () => { setFilters(initialFilters); setPage(1) }
  return <><PageHeader title="Bệnh nhân realtime" description={`Tự động cập nhật mỗi 10 giây · ${filtered.length} lượt phù hợp`}/><VisitStatusFilter filters={filters} onChange={changeFilters} onReset={resetFilters}/>{query.isLoading ? <LoadingSkeleton/> : visible.length ? <><LivePatientTable items={visible} onSelect={setSelected}/><Pagination page={page} totalPages={totalPages} totalItems={filtered.length} onChange={setPage}/></> : <EmptyState title="Không tìm thấy bệnh nhân" description="Hãy thay đổi hoặc đặt lại bộ lọc."/>}<AppModal open={Boolean(selected)} title="Hồ sơ điều phối" onClose={() => setSelected(null)}>{selected && <div className="space-y-5"><div className="rounded-xl bg-slate-900 p-4 text-white"><h3 className="text-xl font-bold">{selected.patientName}</h3><p className="text-slate-300">{selected.patientId} · {selected.id} · Số {selected.queueNumber}</p><p className="mt-2 text-sm text-slate-400">Check-in {formatDateTime(selected.checkinTime)}</p></div><Detail title="Vị trí hiện tại" value={`${selected.department} · Phòng ${selected.room}`}/><Detail title="Bác sĩ phụ trách" value={selected.doctor ?? 'Chưa phân công'}/><Detail title="Bước tiếp theo" value={`${selected.nextStep} · dự kiến hoàn tất ${formatDateTime(selected.estimatedCompletion)}`}/><h3 className="font-bold">Lịch sử trạng thái</h3>{['Check-in hoàn tất','AI đề xuất khoa Nội','Nhân viên xác nhận phòng 201','Đang chờ bác sĩ'].map((item,index) => <div key={item} className="flex gap-3 border-l-2 border-teal-500 pl-4"><strong>{`0${8+index}:1${index}`}</strong><span>{item}</span></div>)}<div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800"><strong>Nhật ký AI:</strong> 1 đề xuất được chấp nhận · Chưa có lần ghi đè.</div></div>}</AppModal></>
}
const Detail = ({ title, value }: { title: string; value: string }) => <div><p className="text-xs font-bold uppercase text-slate-400">{title}</p><p className="font-semibold">{value}</p></div>
