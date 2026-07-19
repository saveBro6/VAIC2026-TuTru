import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Activity, ArrowRight, Clock, DoorOpen, Stethoscope, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { doctorApi } from '../../api/doctorApi'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { PageHeader } from '../../components/common/PageHeader'
import { DoctorQueueTable } from '../../components/doctor/DoctorQueueTable'
import { Button } from '../../components/ui/button'

export function DoctorDashboardPage() {
  const query = useQuery({ queryKey: ['doctor-queue'], queryFn: () => doctorApi.getQueue() })
  if (query.isLoading) return <LoadingSkeleton/>

  const queue = query.data?.queue ?? []
  const room = query.data?.selectedRoom
  const urgentCount = queue.filter((item) => ['EMERGENCY', 'URGENT', 'HIGH'].includes(item.priority)).length

  return <>
    <PageHeader title="Bảng điều phối bác sĩ" description={room ? `${room.name} · ${room.department}` : 'Hàng đợi theo phòng được phân công'} action={<Button asChild><Link to="/doctor/queue">Mở hàng đợi<ArrowRight/></Link></Button>}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi icon={<Users/>} label="Đang chờ" value={queue.length} note="Trong phòng hiện tại" tone="bg-sky-50 text-sky-700"/>
      <Kpi icon={<Activity/>} label="Ưu tiên" value={urgentCount} note="Cần xử lý sớm" tone="bg-red-50 text-red-700"/>
      <Kpi icon={<Stethoscope/>} label="Đang khám" value={queue.filter((item) => item.status === 'IN_EXAMINATION').length} note="Đang phục vụ" tone="bg-violet-50 text-violet-700"/>
      <Kpi icon={<Clock/>} label="Chờ trung bình" value={`${room?.estimatedWait ?? 0} phút`} note="Theo queue phòng" tone="bg-amber-50 text-amber-700"/>
      <Kpi icon={<DoorOpen/>} label="Phòng hiện tại" value={room?.code ?? room?.name ?? '-'} note={room ? 'Đang hoạt động' : 'Chưa phân phòng'} tone="bg-emerald-50 text-emerald-700"/>
    </div>
    <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Bệnh nhân tiếp theo</h2>
            <p className="text-sm text-muted-foreground">Sắp xếp theo mức ưu tiên và thời gian chờ.</p>
          </div>
          <Link className="text-sm font-semibold text-primary" to="/doctor/queue">Xem tất cả</Link>
        </div>
        <DoctorQueueTable items={queue.slice(0, 5)}/>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl bg-[#082f34] p-5 text-white shadow-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-200/60">Hiệu suất ca trực</p>
          <p className="mt-3 text-4xl font-black">12</p>
          <p className="text-sm text-teal-50/70">bệnh nhân đã hoàn thành</p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-3/4 rounded-full bg-teal-400"/></div>
          <div className="mt-4 flex justify-between text-xs text-teal-100/60"><span>Mục tiêu 16 ca</span><span>75%</span></div>
        </div>
        <div className="card">
          <h3 className="font-bold">Thông tin vận hành</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Thời gian khám TB" value="14 phút"/>
            <Row label="Chờ trung bình" value={`${room?.estimatedWait ?? 0} phút`}/>
            <Row label="Tỷ lệ đúng lịch" value="91%"/>
          </dl>
        </div>
      </div>
    </div>
  </>
}

function Kpi({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: string | number; note: string; tone: string }) {
  return <motion.div whileHover={{ y: -3 }} className="card"><span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>{icon}</span><p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-black tracking-tight">{value}</p><p className="mt-2 text-xs text-muted-foreground">{note}</p></motion.div>
}

const Row = ({ label, value }: { label: string; value: string }) => <div className="flex justify-between border-b border-border pb-3 last:border-0 last:pb-0"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>
