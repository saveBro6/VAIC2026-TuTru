import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Activity, AlertTriangle, CalendarDays, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { patientApi } from '../../api/patientApi'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { PageHeader } from '../../components/common/PageHeader'
import { Progress } from '../../components/ui/progress'
import { useAuthStore } from '../../stores/authStore'
import type { PeakHourForecast, PeakLevel } from '../../types'

const levelLabels: Record<PeakLevel, string> = {
  low: 'Thấp',
  normal: 'Ổn định',
  high: 'Cao điểm',
  very_high: 'Rất cao',
}

const levelStyles: Record<PeakLevel, string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  normal: 'border-sky-200 bg-sky-50 text-sky-700',
  high: 'border-amber-200 bg-amber-50 text-amber-700',
  very_high: 'border-red-200 bg-red-50 text-red-700',
}

const dateKey = (value: string | Date) => format(new Date(value), 'yyyy-MM-dd')
const formatDay = (value: string | Date) => format(new Date(value), 'EEEE, dd/MM', { locale: vi })
const formatHour = (value: string | Date) => format(new Date(value), 'HH:mm', { locale: vi })

export function PatientDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const [selectedDate, setSelectedDate] = useState('')
  const peakQuery = useQuery({
    queryKey: ['patient-peak-hour-forecast', 7],
    queryFn: () => patientApi.getPeakHourForecast(7),
    refetchInterval: 5 * 60_000,
  })

  const days = useMemo(() => {
    const uniqueDays = new Set(peakQuery.data?.forecasts.map((item) => dateKey(item.checkin_time)) ?? [])
    return Array.from(uniqueDays).sort()
  }, [peakQuery.data?.forecasts])

  const activeDate = selectedDate || days[0] || ''
  const selectedForecasts = useMemo(
    () => peakQuery.data?.forecasts.filter((item) => dateKey(item.checkin_time) === activeDate) ?? [],
    [activeDate, peakQuery.data?.forecasts],
  )

  const busiestSlot = selectedForecasts.reduce<PeakHourForecast | null>(
    (best, item) => !best || item.predicted_checkin_count > best.predicted_checkin_count ? item : best,
    null,
  )
  const peakSlots = selectedForecasts.filter((item) => item.is_peak)
  const capacity = busiestSlot ? Math.min(100, Math.round((busiestSlot.predicted_checkin_count / Math.max(peakQuery.data?.peak_threshold ?? 45, 1)) * 70)) : 0

  return <>
    <PageHeader
      title={`Xin chào, ${user?.full_name ?? 'bạn'}`}
      description="Thông tin lượt khám hôm nay của bạn."
      action={<span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">Đang chờ khám</span>}
    />

    <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="section-title"><TrendingUp/>Cường độ cao điểm 7 ngày tới</h2>
            <p className="mt-1 text-sm text-slate-500">Dự báo từ module peak_hour_prediction.</p>
          </div>
          <label className="min-w-48">
            <span className="field-label">Chọn ngày</span>
            <select
              value={activeDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="form-control py-2.5"
              disabled={!days.length}
            >
              {days.map((day) => <option key={day} value={day}>{formatDay(day)}</option>)}
            </select>
          </label>
        </div>

        {peakQuery.isLoading && <div className="mt-5"><LoadingSkeleton rows={3}/></div>}
        {peakQuery.isError && <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertTriangle className="mt-0.5 shrink-0" size={18}/>
          <p className="text-sm font-semibold">Chưa tải được dự báo cao điểm. Vui lòng thử lại sau.</p>
        </div>}
        {!peakQuery.isLoading && !peakQuery.isError && busiestSlot && <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Khung bận nhất</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{formatHour(busiestSlot.checkin_time)}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-sm font-bold ${levelStyles[busiestSlot.peak_level]}`}>{levelLabels[busiestSlot.peak_level]}</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Dự kiến check-in</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{Math.round(busiestSlot.predicted_checkin_count)} người</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Ngưỡng cao điểm</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{Math.round(peakQuery.data?.peak_threshold ?? 0)} người</p>
            </div>
          </div>
          <Progress value={capacity} className="mt-4"/>
        </div>}
      </div>

      <div className="card">
        <h2 className="section-title"><CalendarDays/>Các khung cao điểm trong ngày</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(peakSlots.length ? peakSlots : selectedForecasts.slice(0, 6)).map((slot) => <div key={`${slot.checkin_time}-${slot.slot_index}`} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-black text-slate-950">{formatHour(slot.checkin_time)}</span>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${levelStyles[slot.peak_level]}`}>{levelLabels[slot.peak_level]}</span>
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600"><Activity size={16}/>{Math.round(slot.predicted_checkin_count)} lượt check-in</p>
          </div>)}
        </div>
        {!selectedForecasts.length && !peakQuery.isLoading && <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">Không có dữ liệu dự báo cho ngày đã chọn.</p>}
      </div>
    </section>

  </>
}
