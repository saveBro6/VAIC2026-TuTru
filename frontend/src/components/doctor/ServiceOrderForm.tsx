import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { serviceOrderSchema, type ServiceOrderFormData } from '../../schemas/serviceOrderSchema'
import { AppButton } from '../common/AppButton'

const departments = [
  ['CARD', 'Khoa Tim mạch'],
  ['NEURO', 'Khoa Thần kinh'],
  ['ENT', 'Khoa Tai Mũi Họng'],
  ['DERM', 'Khoa Da liễu'],
  ['PED', 'Khoa Nhi'],
  ['OBGYN', 'Khoa Sản Phụ khoa'],
  ['ORTHO', 'Khoa Cơ Xương Khớp'],
  ['GASTRO', 'Khoa Tiêu hóa - Gan mật'],
  ['RESP', 'Khoa Hô hấp'],
  ['URO', 'Khoa Tiết niệu'],
  ['OPH', 'Khoa Mắt'],
  ['ENDO', 'Khoa Nội tiết'],
  ['PSYCH', 'Khoa Tâm thần - Tâm lý'],
]

export function ServiceOrderForm({ onSubmit, loading }: { onSubmit: (data: ServiceOrderFormData) => void; loading?: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ServiceOrderFormData>({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues: { type: '', targetDepartment: '', priority: 'NORMAL', clinicalNote: '', specialRequest: '', useAI: false },
  })

  return <form className="card space-y-5" onSubmit={handleSubmit(onSubmit)}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Loại dịch vụ">
        <select {...register('type')} className="form-control">
          <option value="">Chọn dịch vụ</option>
          <option value="CLINICAL_CONSULT">Khám chuyên khoa khác</option>
          <option value="XRAY">X-quang</option>
          <option value="ABDOMINAL_ULTRASOUND">Siêu âm</option>
          <option value="RESULT_REVIEW">Đọc kết quả</option>
        </select>
        <p className="text-sm text-red-600">{errors.type?.message}</p>
      </Field>
      <Field label="Khoa đích">
        <select {...register('targetDepartment')} className="form-control">
          <option value="">Chọn khoa</option>
          {departments.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <p className="text-sm text-red-600">{errors.targetDepartment?.message}</p>
      </Field>
      <Field label="Mức ưu tiên">
        <select {...register('priority')} className="form-control">
          <option value="NORMAL">Bình thường</option>
          <option value="URGENT">Khẩn cấp</option>
          <option value="EMERGENCY">Cấp cứu</option>
        </select>
      </Field>
    </div>
    <Field label="Ghi chú lâm sàng">
      <textarea {...register('clinicalNote')} className="form-control" rows={4}/>
      <p className="text-sm text-red-600">{errors.clinicalNote?.message}</p>
    </Field>
    <Field label="Yêu cầu đặc biệt">
      <input {...register('specialRequest')} className="form-control"/>
    </Field>
    <AppButton loading={loading} type="submit">Tạo chỉ định</AppButton>
  </form>
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="field-label">{label}</span>{children}</label>
