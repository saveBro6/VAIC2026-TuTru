import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Megaphone, Play, RotateCcw, UserX, XCircle } from 'lucide-react'
import type { ComponentType } from 'react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { doctorApi } from '../../api/doctorApi'
import type { QueueEntry, QueueEntryStatus, VisitStatus } from '../../types'
import { priorityClass, priorityLabel } from '../../utils/priority'
import { AppTable, type TableColumn } from '../common/AppTable'
import { Badge } from '../common/Badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'

const queueStatusMeta: Record<
  QueueEntryStatus,
  {
    label: string
    actionLabel?: string
    successMessage: string
    className: string
    actionClassName: string
    icon: ComponentType<{ size?: number }>
  }
> = {
  WAITING: {
    label: 'Đang chờ',
    successMessage: 'Đã đưa bệnh nhân về hàng đợi',
    className: 'bg-slate-100 text-slate-700',
    actionClassName: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
    icon: RotateCcw,
  },
  CALLED: {
    label: 'Đã gọi',
    successMessage: 'Đã gọi bệnh nhân vào phòng',
    className: 'bg-sky-50 text-sky-700',
    actionClassName: 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
    icon: Megaphone,
  },
  IN_SERVICE: {
    label: 'Đang khám',
    actionLabel: 'Khám chỉ định',
    successMessage: 'Đã chuyển bệnh nhân sang đang khám',
    className: 'bg-indigo-50 text-indigo-700',
    actionClassName: 'bg-[#176b9b] text-white hover:bg-[#145b84]',
    icon: Play,
  },
  DONE: {
    label: 'Hoàn tất',
    successMessage: 'Đã hoàn tất phòng hiện tại và kích hoạt bước tiếp theo',
    className: 'bg-emerald-50 text-emerald-700',
    actionClassName: 'bg-emerald-600 text-white hover:bg-emerald-700',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Đã hủy',
    successMessage: 'Đã hủy lượt chờ',
    className: 'bg-red-50 text-red-700',
    actionClassName: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    icon: XCircle,
  },
  NO_SHOW: {
    label: 'Vắng mặt',
    successMessage: 'Đã đánh dấu bệnh nhân vắng mặt',
    className: 'bg-amber-50 text-amber-700',
    actionClassName: 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    icon: UserX,
  },
}

const visitStatusToQueueStatus: Partial<Record<VisitStatus, QueueEntryStatus>> = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_EXAMINATION: 'IN_SERVICE',
  IN_SERVICE: 'IN_SERVICE',
  COMPLETED: 'DONE',
  CANCELLED: 'CANCELLED',
}

const statusActions = Object.keys(queueStatusMeta) as QueueEntryStatus[]

function getQueueStatus(row: QueueEntry): QueueEntryStatus {
  return row.queueStatus ?? visitStatusToQueueStatus[row.status] ?? 'WAITING'
}

export function DoctorQueueTable({ items }: { items: QueueEntry[] }) {
  const queryClient = useQueryClient()
  const [prescribingRow, setPrescribingRow] = useState<QueueEntry | null>(null)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const specialtyQuery = useQuery({
    queryKey: ['doctor-clinical-specialties'],
    queryFn: doctorApi.getClinicalSpecialties,
    enabled: Boolean(prescribingRow),
  })
  const statusMutation = useMutation({
    mutationFn: ({ queueEntryId, status }: { queueEntryId: string; status: QueueEntryStatus }) =>
      doctorApi.updateQueueStatus(queueEntryId, status),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['doctor-queue'] })
      toast.success(queueStatusMeta[variables.status].successMessage)
    },
    onError: () => toast.error('Không thể cập nhật trạng thái bệnh nhân'),
  })
  const prescribeMutation = useMutation({
    mutationFn: ({ queueEntryId, clinicSpecialities }: { queueEntryId: string; clinicSpecialities: string[] }) =>
      doctorApi.prescribeAndStartExam(queueEntryId, clinicSpecialities),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['doctor-queue'] })
      toast.success('Đã bắt đầu khám và xếp lộ trình chỉ định chạy nền')
      setPrescribingRow(null)
      setSelectedSpecialties([])
    },
    onError: () => toast.error('Không thể tạo chỉ định khám'),
  })

  const setStatus = (row: QueueEntry, status: QueueEntryStatus) => {
    if (!row.queueEntryId) {
      toast.error('Thiếu mã queue entry')
      return
    }
    statusMutation.mutate({ queueEntryId: row.queueEntryId, status })
  }

  const openPrescriptionDialog = (row: QueueEntry) => {
    if (!row.queueEntryId) {
      toast.error('Thiếu mã queue entry')
      return
    }
    setPrescribingRow(row)
    setSelectedSpecialties([])
  }

  const toggleSpecialty = (specialtyId: string) => {
    setSelectedSpecialties((current) =>
      current.includes(specialtyId)
        ? current.filter((item) => item !== specialtyId)
        : [...current, specialtyId],
    )
  }

  const submitPrescription = () => {
    if (!prescribingRow?.queueEntryId) return
    if (selectedSpecialties.length === 0) {
      toast.error('Chọn ít nhất một chuyên khoa cần chỉ định')
      return
    }
    prescribeMutation.mutate({
      queueEntryId: prescribingRow.queueEntryId,
      clinicSpecialities: selectedSpecialties,
    })
  }

  const columns: TableColumn<QueueEntry>[] = [
    { key: 'number', header: 'Số', render: (row) => <strong className="text-lg text-[#176b9b]">{row.queueNumber}</strong> },
    { key: 'patient', header: 'Bệnh nhân', render: (row) => <div><strong>{row.patientName}</strong><p className="text-xs text-slate-500">{row.age ? `${row.age} tuổi · ` : ''}{row.visitId}</p></div> },
    { key: 'symptom', header: 'Triệu chứng chính', render: (row) => <span className="line-clamp-2 max-w-xs">{row.mainSymptom}</span> },
    { key: 'priority', header: 'Ưu tiên', render: (row) => <Badge className={priorityClass[row.priority]}>{priorityLabel[row.priority]}</Badge> },
    { key: 'wait', header: 'Đã chờ', render: (row) => <strong className={row.waitedMinutes > 30 ? 'text-red-600' : ''}>{row.waitedMinutes} phút</strong> },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => {
        const meta = queueStatusMeta[getQueueStatus(row)]
        return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>
      },
    },
    {
      key: 'action',
      header: 'Cập nhật',
      render: (row) => {
        const currentStatus = getQueueStatus(row)

        return <div className="grid min-w-[280px] grid-cols-2 gap-2 xl:grid-cols-3">
          {statusActions.map((status) => {
            const meta = queueStatusMeta[status]
            const Icon = meta.icon
            if (status === 'IN_SERVICE') {
              return <button key={status} disabled={statusMutation.isPending || prescribeMutation.isPending} onClick={() => openPrescriptionDialog(row)} className={`inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-45 ${meta.actionClassName}`}><Icon size={14}/>{meta.actionLabel ?? meta.label}</button>
            }
            return <button key={status} disabled={statusMutation.isPending || currentStatus === status} onClick={() => setStatus(row, status)} className={`inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-45 ${meta.actionClassName}`}><Icon size={14}/>{meta.label}</button>
          })}
        </div>
      },
    },
  ]

  return <>
    <AppTable columns={columns} data={items} rowKey={(row) => row.queueEntryId ?? row.visitId}/>
    <Dialog open={Boolean(prescribingRow)} onOpenChange={(open) => { if (!open) setPrescribingRow(null) }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Khám chỉ định</DialogTitle>
          <DialogDescription>
            Chọn các chuyên khoa bệnh nhân cần đi tiếp. Hệ thống trả kết quả ngay, sau đó tạo task, tối ưu lộ trình và xếp hàng phòng đầu tiên ở nền.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">{prescribingRow?.queueNumber} · {prescribingRow?.patientName}</p>
          <p className="mt-1 text-sm text-slate-600">{prescribingRow?.mainSymptom}</p>
        </div>
        <div className="mt-4 grid max-h-[48vh] gap-3 overflow-auto pr-1 md:grid-cols-2">
          {specialtyQuery.isLoading ? <p className="text-sm font-semibold text-slate-500">Đang tải chuyên khoa...</p> : specialtyQuery.data?.map((specialty) => {
            const selected = selectedSpecialties.includes(specialty.id)
            return <button key={specialty.id} type="button" onClick={() => toggleSpecialty(specialty.id)} className={`rounded-xl border p-4 text-left transition ${selected ? 'border-[#176b9b] bg-sky-50 ring-4 ring-sky-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <span className="flex items-start gap-3">
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${selected ? 'border-[#176b9b] bg-[#176b9b]' : 'border-slate-300'}`}>{selected && <CheckCircle2 className="text-white" size={14}/>}</span>
                <span className="min-w-0">
                  <strong className="block text-slate-950">{specialty.name}</strong>
                  <span className="mt-1 block text-sm text-slate-500">{specialty.departmentName}</span>
                  <span className="mt-2 block text-xs font-semibold text-slate-400">{specialty.suggestedRoomName ?? 'Chưa có phòng gợi ý'} · chờ khoảng {specialty.estimatedWait} phút</span>
                </span>
              </span>
            </button>
          })}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setPrescribingRow(null)} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50">Hủy</button>
          <button type="button" disabled={prescribeMutation.isPending || selectedSpecialties.length === 0} onClick={submitPrescription} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#176b9b] px-5 text-sm font-bold text-white hover:bg-[#145b84] disabled:cursor-not-allowed disabled:opacity-50"><Play size={16}/>Bắt đầu khám chỉ định</button>
        </div>
      </DialogContent>
    </Dialog>
  </>
}
