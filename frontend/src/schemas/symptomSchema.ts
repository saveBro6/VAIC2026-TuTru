import { z } from 'zod'
export const symptomSchema = z.object({ description: z.string().min(10, 'Mô tả cần ít nhất 10 ký tự'), onset: z.string().min(1, 'Vui lòng chọn thời gian xuất hiện'), painLevel: z.number().min(0).max(10), commonSymptoms: z.array(z.string()), dangerSigns: z.array(z.string()) })
export type SymptomFormData = z.infer<typeof symptomSchema>
