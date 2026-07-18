import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'
import { DepartmentLoadChart } from '../../components/admin/DepartmentLoadChart'
import { HospitalOverviewCards } from '../../components/admin/HospitalOverviewCards'
import { PeakHourChart } from '../../components/admin/PeakHourChart'
import { OperationalCharts } from '../../components/admin/OperationalCharts'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { PageHeader } from '../../components/common/PageHeader'
export function AdminDashboardPage() { const query = useQuery({ queryKey: ['admin-dashboard'], queryFn: adminApi.getDashboard, refetchInterval: 30_000 }); if (query.isLoading) return <LoadingSkeleton rows={7}/>; const peak = query.data!.forecasts.find((item) => item.is_peak); const averageWait = Math.round(query.data!.rooms.reduce((sum, room) => sum + room.averageWait, 0) / query.data!.rooms.length); return <><PageHeader title="Tổng quan bệnh viện" description="Dữ liệu vận hành tự cập nhật mỗi 30 giây"/><div className="mb-4 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-teal-700 p-4 text-white"><p className="text-sm text-teal-100">Khung giờ cao điểm tiếp theo</p><p className="text-2xl font-black">{peak ? new Date(peak.checkin_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Không có'}</p></div><div className="rounded-2xl bg-slate-900 p-4 text-white"><p className="text-sm text-slate-400">Thời gian chờ trung bình toàn viện</p><p className="text-2xl font-black">{averageWait} phút</p></div></div><HospitalOverviewCards/><div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.6fr]"><PeakHourChart data={query.data!.forecasts}/><DepartmentLoadChart/></div><OperationalCharts/></> }
