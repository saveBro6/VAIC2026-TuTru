import type { PatientVisit } from '../../types'
import { formatTime } from '../../utils/date'
import { priorityClass, priorityLabel } from '../../utils/priority'
import { visitStatusLabel } from '../../utils/status'
import { AppTable, type TableColumn } from '../common/AppTable'
import { Badge } from '../common/Badge'
export function LivePatientTable({ items, onSelect }: { items: PatientVisit[]; onSelect?: (item: PatientVisit) => void }) { const columns: TableColumn<PatientVisit>[] = [{ key: 'id', header: 'Mã lượt', render: (r) => <div><strong>{r.id}</strong><p>{r.queueNumber}</p></div> }, { key: 'patient', header: 'Bệnh nhân', render: (r) => r.patientName }, { key: 'time', header: 'Check-in', render: (r) => formatTime(r.checkinTime) }, { key: 'priority', header: 'Ưu tiên', render: (r) => <Badge className={priorityClass[r.priority]}>{priorityLabel[r.priority]}</Badge> }, { key: 'status', header: 'Trạng thái', render: (r) => visitStatusLabel[r.status] }, { key: 'location', header: 'Vị trí', render: (r) => `${r.department} · ${r.room}` }, { key: 'wait', header: 'Đã chờ', render: (r) => `${r.waitingMinutes} phút` }, { key: 'next', header: 'Tiếp theo', render: (r) => r.nextStep }]; return <AppTable data={items} columns={columns} rowKey={(r) => r.id} onRowClick={onSelect}/> }
