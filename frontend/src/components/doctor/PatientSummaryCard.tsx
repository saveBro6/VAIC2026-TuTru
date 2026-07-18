import { UserRound } from 'lucide-react'
import type { QueueEntry } from '../../types'
export function PatientSummaryCard({ patient }: { patient: QueueEntry }) { return <div className="card"><h2 className="section-title"><UserRound/>Thông tin bệnh nhân</h2><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><Info label="Họ tên" value={patient.patientName}/><Info label="Tuổi" value={`${patient.age}`}/><Info label="Số thứ tự" value={patient.queueNumber}/><Info label="Đã chờ" value={`${patient.waitedMinutes} phút`}/></div></div> }
const Info = ({ label, value }: { label: string; value: string }) => <div><p className="text-slate-500">{label}</p><p className="font-bold">{value}</p></div>
