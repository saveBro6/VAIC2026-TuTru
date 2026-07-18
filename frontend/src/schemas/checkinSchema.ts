import { z } from 'zod'
export const checkinSchema = z.object({ examinationType: z.string().min(1, 'Vui lòng chọn loại khám'), patientType: z.string().min(1, 'Vui lòng chọn loại bệnh nhân') })
export type CheckinFormData = z.infer<typeof checkinSchema>
