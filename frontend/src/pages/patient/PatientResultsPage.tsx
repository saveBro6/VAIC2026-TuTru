import { useQuery } from '@tanstack/react-query'
import { patientApi } from '../../api/patientApi'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { PageHeader } from '../../components/common/PageHeader'
import { ResultPredictionCard } from '../../components/patient/ResultPredictionCard'
import { useVisitStore } from '../../stores/visitStore'
export function PatientResultsPage() { const visitId = useVisitStore((s) => s.visitId) ?? 'VIS-260718-042'; const query = useQuery({ queryKey: ['results', visitId], queryFn: () => patientApi.getResults(visitId) }); return <><PageHeader title="Kết quả dịch vụ" description="Chỉ hiển thị kết luận đã được bác sĩ xác nhận."/>{query.isLoading ? <LoadingSkeleton/> : <div className="space-y-4">{query.data?.map((result) => <ResultPredictionCard key={result.id} result={result}/>)}</div>}<div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">Kết quả chưa được bác sĩ xác nhận sẽ không hiển thị kết luận y khoa.</div></> }
