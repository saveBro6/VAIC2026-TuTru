import { z } from 'zod'
export const serviceOrderSchema = z.object({ type: z.string().min(1, 'Chọn loại dịch vụ'), targetDepartment: z.string().min(1, 'Chọn khoa đích'), priority: z.enum(['EMERGENCY', 'URGENT', 'HIGH', 'NORMAL', 'LOW']), clinicalNote: z.string().min(5, 'Ghi chú cần ít nhất 5 ký tự'), specialRequest: z.string().optional(), useAI: z.boolean() })
export type ServiceOrderFormData = z.infer<typeof serviceOrderSchema>
