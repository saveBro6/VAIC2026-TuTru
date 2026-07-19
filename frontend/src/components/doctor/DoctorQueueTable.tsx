import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ClipboardPlus, Play, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { doctorApi } from '../../api/doctorApi'
import type { QueueEntry, QueueEntryStatus } from '../../types'
import { priorityClass, priorityLabel } from '../../utils/priority'
import { visitStatusLabel } from '../../utils/status'
import { AppTable, type TableColumn } from '../common/AppTable'
import { Badge } from '../common/Badge'

export function DoctorQueueTable({ items }: { items: QueueEntry[] }) {
  const queryClient = useQueryClient()
  const statusMutation = useMutation({
    mutationFn: ({ queueEntryId, status }: { queueEntryId: string; status: QueueEntryStatus }) => doctorApi.updateQueueStatus(queueEntryId, status),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['doctor-queue'] })
      toast.success(statusLabel[variables.status])
    },
    onError: () => toast.error('Không thể cập nhật trạng thái bệnh nhân'),
  })

  const setStatus = (row: QueueEntry, status: QueueEntryStatus) => {
    if (!row.queueEntryId) {
      toast.error('Thiếu mã queue entry')
      return
    }
    statusMutation.mutate({ queueEntryId: row.queueEntryId, status })
  }

  const columns: TableColumn<QueueEntry>[] = [
    { key: 'number', header: 'Số', render: (row) => <strong className="text-lg text-[#176b9b]">{row.queueNumber}</strong> },
    { key: 'patient', header: 'Bệnh nhân', render: (row) => <div><strong>{row.patientName}</strong><p className="text-xs text-slate-500">{row.age ? `${row.age} tuổi · ` : ''}{row.visitId}</p></div> },
    { key: 'symptom', header: 'Triệu chứng chính', render: (row) => <span className="line-clamp-2 max-w-xs">{row.mainSymptom}</span> },
    { key: 'priority', header: 'Ưu tiên', render: (row) => <Badge className={priorityClass[row.priority]}>{priorityLabel[row.priority]}</Badge> },
    { key: 'wait', header: 'Đã chờ', render: (row) => <strong className={row.waitedMinutes > 30 ? 'text-red-600' : ''}>{row.waitedMinutes} phút</strong> },
    { key: 'status', header: 'Trạng thái', render: (row) => <span className="font-semibold text-slate-700">{visitStatusLabel[row.status]}</span> },
    {
      key: 'action',
      header: 'Thao tác',
      render: (row) => <div className="flex min-w-64 flex-wrap gap-2">
        <button disabled={statusMutation.isPending} onClick={() => setStatus(row, 'CALLED')} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-2 text-xs font-bold text-slate-700"><RotateCcw size={14}/>Gọi</button>
        <button disabled={statusMutation.isPending} onClick={() => setStatus(row, 'IN_SERVICE')} className="inline-flex items-center gap-1 rounded-md bg-[#176b9b] px-2.5 py-2 text-xs font-bold text-white"><Play size={14}/>Đang khám</button>
        <button disabled={statusMutation.isPending} onClick={() => setStatus(row, 'DONE')} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-2 text-xs font-bold text-white"><CheckCircle2 size={14}/>Hoàn tất</button>
        <Link to={`/doctor/orders/${row.visitId}`} className="inline-flex items-center gap-1 rounded-md border border-[#f0c5b4] bg-[#fff7f2] px-2.5 py-2 text-xs font-bold text-[#a54c2d]"><ClipboardPlus size={14}/>Khám thêm</Link>
      </div>,
    },
  ]

  return <AppTable columns={columns} data={items} rowKey={(row) => row.queueEntryId ?? row.visitId}/>
}

const statusLabel: Record<QueueEntryStatus, string> = {
  WAITING: 'Đã đưa bệnh nhân về hàng đợi',
  CALLED: 'Đã gọi bệnh nhân vào phòng',
  IN_SERVICE: 'Đã chuyển bệnh nhân sang đang khám',
  DONE: 'Đã hoàn tất phòng hiện tại và kích hoạt bước tiếp theo',
  CANCELLED: 'Đã hủy lượt chờ',
  NO_SHOW: 'Đã đánh dấu bệnh nhân vắng mặt',
}
