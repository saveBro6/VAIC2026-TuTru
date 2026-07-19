import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/adminApi'
import { RoomStatusGrid } from '../../components/admin/RoomStatusGrid'
import { EmptyState } from '../../components/common/EmptyState'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { PageHeader } from '../../components/common/PageHeader'
import type { Room } from '../../types'
import { POLLING } from '../../utils/constants'

export function RoomManagementPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Room['status'] | 'ALL'>('ALL')
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['admin-rooms'], queryFn: adminApi.getRooms, refetchInterval: POLLING.roomStatus })
  const mutation = useMutation({ mutationFn: ({ id, status: next }: { id: string; status: Room['status'] }) => adminApi.updateRoomStatus(id, next), onSuccess: () => { toast.success('Đã cập nhật trạng thái phòng'); void client.invalidateQueries({ queryKey: ['admin-rooms'] }) } })
  const filtered = useMemo(() => (query.data ?? []).filter((room) => `${room.code} ${room.name} ${room.department} ${room.doctor ?? ''}`.toLowerCase().includes(search.toLowerCase()) && (status === 'ALL' || room.status === status)), [query.data, search, status])
  return <><PageHeader title="Quản lý phòng" description={`${filtered.length} phòng phù hợp · tự cập nhật mỗi 15 giây`}/><div className="card mb-4 grid gap-3 md:grid-cols-[1fr_220px]"><label className="relative"><Search className="pointer-events-none absolute left-4 top-3 text-slate-400" size={20}/><input className="form-control pl-12 pr-5" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm phòng, khoa hoặc bác sĩ..."/></label><select value={status} onChange={(e) => setStatus(e.target.value as Room['status'] | 'ALL')} className="form-control"><option value="ALL">Tất cả trạng thái</option><option value="OPEN">Đang mở</option><option value="PAUSED">Tạm dừng</option><option value="CLOSED">Đã đóng</option></select></div>{query.isLoading ? <LoadingSkeleton/> : filtered.length ? <RoomStatusGrid rooms={filtered} onStatus={(id,next) => mutation.mutate({ id, status: next })}/> : <EmptyState title="Không tìm thấy phòng"/>}</>
}
