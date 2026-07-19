import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, ClipboardPlus } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'
import { doctorApi } from '../../api/doctorApi'
import { AppButton } from '../../components/common/AppButton'
import { PageHeader } from '../../components/common/PageHeader'
import { ServiceOrderForm } from '../../components/doctor/ServiceOrderForm'
import type { ServiceOrderFormData } from '../../schemas/serviceOrderSchema'

export function ServiceOrderPage() {
  const { visitId = 'VIS-100' } = useParams()
  const [created, setCreated] = useState(false)
  const create = useMutation({
    mutationFn: (data: ServiceOrderFormData) => doctorApi.createOrder(visitId, { ...data, room: undefined }),
    onSuccess: () => {
      setCreated(true)
      toast.success('Đã tạo chỉ định và cập nhật lộ trình bệnh nhân')
    },
    onError: () => toast.error('Không thể tạo chỉ định'),
  })

  const submit = (data: ServiceOrderFormData) => {
    setCreated(false)
    create.mutate(data)
  }

  if (created) return <>
    <PageHeader title="Tạo chỉ định dịch vụ"/>
    <div className="card mx-auto max-w-xl text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={34}/></span>
      <h2 className="mt-4 text-2xl font-black">Tạo chỉ định thành công</h2>
      <p className="mt-2 text-slate-500">Bước mới đã được thêm vào lộ trình. Bệnh nhân chưa chiếm vị trí ở queue phòng tiếp theo cho tới khi phòng hiện tại hoàn tất.</p>
      <AppButton className="mt-6" onClick={() => setCreated(false)}>Tạo chỉ định khác</AppButton>
    </div>
  </>

  return <>
    <PageHeader title="Tạo chỉ định dịch vụ" description={`Lượt khám ${visitId}`}/>
    <div className="grid gap-5 xl:grid-cols-[1fr_.75fr]">
      <ServiceOrderForm loading={create.isPending} onSubmit={submit}/>
      <div className="card">
        <h2 className="section-title"><ClipboardPlus/>Luồng lộ trình</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Chỉ định mới sẽ được lưu là bước chờ trong pathway. Khi bác sĩ hoàn tất phòng hiện tại, backend sẽ gọi optimize-sequence cho các bước còn lại rồi mới tạo queue entry cho phòng incoming.</p>
      </div>
    </div>
  </>
}
