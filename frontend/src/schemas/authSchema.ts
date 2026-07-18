import { z } from 'zod'
export const authSchema = z.object({ identifier: z.string().min(5, 'Nhập email hoặc số điện thoại hợp lệ'), password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự') })
export type AuthFormData = z.infer<typeof authSchema>
