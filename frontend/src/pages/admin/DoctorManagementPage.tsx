import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'
import { DoctorStatusTable } from '../../components/admin/DoctorStatusTable'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { PageHeader } from '../../components/common/PageHeader'
export function DoctorManagementPage() { const query = useQuery({ queryKey: ['admin-doctors'], queryFn: adminApi.getDoctors }); return <><PageHeader title="Quản lý bác sĩ" description="Theo dõi ca trực và hiệu suất khám hôm nay."/>{query.isLoading ? <LoadingSkeleton/> : <DoctorStatusTable doctors={query.data ?? []}/>}</> }
