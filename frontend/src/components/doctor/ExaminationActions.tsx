import { CheckCircle2, Play } from 'lucide-react'
import { AppButton } from '../common/AppButton'

export function ExaminationActions({ onStart, onComplete }: { visitId: string; onStart: () => void; onComplete: () => void }) {
  return <div className="flex flex-wrap gap-3"><AppButton onClick={onStart}><Play size={18}/>Bắt đầu khám</AppButton><AppButton variant="secondary" onClick={onComplete}><CheckCircle2 size={18}/>Hoàn thành khám</AppButton></div>
}
