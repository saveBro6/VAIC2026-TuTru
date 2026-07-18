import { CheckCircle2, Play, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppButton } from '../common/AppButton'
export function ExaminationActions({ visitId, onStart, onComplete }: { visitId: string; onStart: () => void; onComplete: () => void }) { return <div className="flex flex-wrap gap-3"><AppButton onClick={onStart}><Play size={18}/>Bắt đầu khám</AppButton><Link to={`/doctor/orders/${visitId}`}><AppButton variant="secondary"><Plus size={18}/>Tạo chỉ định</AppButton></Link><AppButton variant="secondary" onClick={onComplete}><CheckCircle2 size={18}/>Hoàn thành khám</AppButton></div> }
