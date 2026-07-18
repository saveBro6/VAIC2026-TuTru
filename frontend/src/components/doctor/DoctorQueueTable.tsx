import { Link } from 'react-router-dom'
import type { QueueEntry } from '../../types'
import { priorityClass, priorityLabel } from '../../utils/priority'
import { visitStatusLabel } from '../../utils/status'
import { AppTable, type TableColumn } from '../common/AppTable'
import { Badge } from '../common/Badge'
export function DoctorQueueTable({ items }: { items: QueueEntry[] }) { const columns: TableColumn<QueueEntry>[] = [{ key: 'number', header: 'Số', render: (r) => <strong>{r.queueNumber}</strong> }, { key: 'patient', header: 'Bệnh nhân', render: (r) => <div><strong>{r.patientName}</strong><p className="text-xs text-slate-500">{r.age} tuổi</p></div> }, { key: 'symptom', header: 'Triệu chứng', render: (r) => r.mainSymptom }, { key: 'priority', header: 'Ưu tiên', render: (r) => <Badge className={priorityClass[r.priority]}>{priorityLabel[r.priority]}</Badge> }, { key: 'wait', header: 'Đã chờ', render: (r) => <strong className={r.waitedMinutes > 30 ? 'text-red-600' : ''}>{r.waitedMinutes} phút</strong> }, { key: 'status', header: 'Trạng thái', render: (r) => visitStatusLabel[r.status] }, { key: 'action', header: '', render: (r) => <Link to={`/doctor/examination/${r.visitId}`} className="font-bold text-teal-700 hover:underline">Bắt đầu khám</Link> }]; return <AppTable columns={columns} data={items} rowKey={(r) => r.visitId}/> }
