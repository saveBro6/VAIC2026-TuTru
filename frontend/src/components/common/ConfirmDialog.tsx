import { AppModal } from './AppModal'
import { AppButton } from './AppButton'
export function ConfirmDialog({ open, title, message, onCancel, onConfirm }: { open: boolean; title: string; message: string; onCancel: () => void; onConfirm: () => void }) { return <AppModal open={open} title={title} onClose={onCancel}><p className="mb-6 text-slate-600">{message}</p><div className="flex justify-end gap-3"><AppButton variant="secondary" onClick={onCancel}>Huỷ</AppButton><AppButton variant="danger" onClick={onConfirm}>Xác nhận</AppButton></div></AppModal> }
