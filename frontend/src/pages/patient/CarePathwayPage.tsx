import { MapPinned } from 'lucide-react'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { PageHeader } from '../../components/common/PageHeader'
import { CarePathwayTimeline } from '../../components/patient/CarePathwayTimeline'
import { usePatientPathway } from '../../hooks/usePatientPathway'
import { useVisitStore } from '../../stores/visitStore'
export function CarePathwayPage() { const visitId = useVisitStore((s) => s.visitId); const query = usePatientPathway(visitId ?? 'VIS-260718-042'); if (query.isLoading) return <LoadingSkeleton/>; const data = query.data!; return <><PageHeader title="Lộ trình khám" description="Tự động cập nhật mỗi 15 giây."/><div className="sticky top-20 z-20 mb-6 grid gap-3 rounded-2xl bg-slate-900 p-4 text-white shadow-xl sm:grid-cols-4"><Metric label="Số thứ tự" value={data.queueNumber}/><Metric label="Phòng hiện tại" value={data.currentRoom}/><Metric label="Phía trước" value={`${data.peopleAhead} bệnh nhân`}/><Metric label="Chờ dự kiến" value={`${data.estimatedWait} phút`}/></div><div className="card"><h2 className="section-title mb-6"><MapPinned/>Hành trình của bạn</h2><CarePathwayTimeline steps={data.steps}/></div></> }
const Metric = ({ label, value }: { label: string; value: string }) => <div><p className="text-xs text-slate-400">{label}</p><p className="font-extrabold">{value}</p></div>
