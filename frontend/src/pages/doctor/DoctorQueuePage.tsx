import { useQuery } from '@tanstack/react-query'
import { Activity, Clock3, MoreHorizontal, Pause, Play, Search, UserRound, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { doctorApi } from '../../api/doctorApi'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { PageHeader } from '../../components/common/PageHeader'
import { DoctorQueueTable } from '../../components/doctor/DoctorQueueTable'
import { POLLING } from '../../utils/constants'

export function DoctorQueuePage() {
  const [search, setSearch] = useState('')
  const [roomOpen, setRoomOpen] = useState(true)
  const [selectedRoomId, setSelectedRoomId] = useState<string>()
  const query = useQuery({
    queryKey: ['doctor-queue', selectedRoomId],
    queryFn: () => doctorApi.getQueue(selectedRoomId),
    refetchInterval: POLLING.doctorQueue,
  })
  const queueItems = query.data?.queue ?? []
  const selectedRoom = query.data?.selectedRoom
  const filtered = useMemo(
    () => queueItems.filter((item) => `${item.patientName} ${item.queueNumber} ${item.mainSymptom}`.toLowerCase().includes(search.toLowerCase())),
    [queueItems, search],
  )
  const current = filtered.find((item) => item.queueStatus === 'IN_SERVICE' || item.status === 'IN_EXAMINATION') ?? filtered[0]

  return <>
    <PageHeader
      title={selectedRoom?.name ?? 'Phòng khám của tôi'}
      description={selectedRoom ? `${selectedRoom.department} · ${selectedRoom.specialty} · ${selectedRoom.floor ?? 'Chưa rõ tầng'}` : 'Chọn phòng khám được phân công'}
      action={<div className="flex flex-wrap items-center gap-2">
        <select value={selectedRoomId ?? selectedRoom?.id ?? ''} onChange={(event) => setSelectedRoomId(event.target.value || undefined)} className="form-control h-11 min-w-52">
          {(query.data?.rooms ?? []).map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
        </select>
        <span className={`rounded-full px-3 py-2 text-sm font-bold ${roomOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{roomOpen ? 'Đang tiếp nhận' : 'Tạm dừng'}</span>
        <button onClick={() => { setRoomOpen(!roomOpen); toast.success(roomOpen ? 'Đã tạm dừng nhận bệnh nhân' : 'Đã mở lại phòng') }} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">
          {roomOpen ? <Pause size={17}/> : <Play size={17}/>} {roomOpen ? 'Tạm dừng phòng' : 'Mở phòng'}
        </button>
      </div>}
    />
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <Summary icon={<Users/>} label="Đang đợi" value={filtered.length}/>
      <Summary icon={<Clock3/>} label="Chờ trung bình" value={`${selectedRoom?.estimatedWait ?? 0} phút`}/>
      <Summary icon={<Activity/>} label="Đã khám hôm nay" value="12"/>
    </div>
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0">
        <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-xl font-extrabold text-slate-950">Hàng đợi của phòng</h2>
          <label className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-4 top-3 text-slate-400" size={18}/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="form-control h-11 pl-12 pr-5" placeholder="Tìm số, tên, triệu chứng..."/>
          </label>
        </div>
        {query.isLoading ? <LoadingSkeleton/> : <DoctorQueueTable items={filtered}/>}
      </section>
      <aside className="2xl:sticky 2xl:top-24 2xl:self-start">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-[#f8faf9] px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#125f52]">Đang xử lý</p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-950">{current?.queueNumber ?? '-'} · {current?.patientName ?? 'Chưa có'}</h2>
            </div>
            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><MoreHorizontal/></button>
          </div>
          {current && <div className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-600"><UserRound/></span>
              <div>
                <p className="font-bold text-slate-900">{current.patientName}</p>
                <p className="text-sm text-slate-500">{current.age ? `${current.age} tuổi · ` : ''}{current.visitId}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-4">
              <Detail label="Triệu chứng chính" value={current.mainSymptom}/>
              <Detail label="Mức ưu tiên" value={current.priority}/>
              <Detail label="Đã chờ" value={`${current.waitedMinutes} phút`}/>
            </dl>
          </div>}
        </div>
      </aside>
    </div>
  </>
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-[#125f52]">{icon}</span><div><span className="text-sm font-semibold text-slate-500">{label}</span><div className="text-2xl font-extrabold text-slate-950">{value}</div></div></div>
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-slate-100 pb-3 last:border-0"><dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 font-semibold leading-6 text-slate-800">{value}</dd></div>
}

