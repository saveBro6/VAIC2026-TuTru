import type { Priority } from '../../types'
import { priorityLabel } from '../../utils/priority'
export function PrioritySelector({ value, onChange }: { value: Priority; onChange: (value: Priority) => void }) { return <label><span className="field-label">Mức ưu tiên</span><select className="form-control" value={value} onChange={(e) => onChange(e.target.value as Priority)}>{Object.entries(priorityLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label> }
