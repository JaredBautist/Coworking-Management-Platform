import { useState, useMemo } from 'react'
import {
  useSpaceUtilization,
  useDailyReservations,
  exportToCSV,
  calculateOccupancyRate,
} from './hooks'
import { SkeletonTable } from '@/components/shared/SkeletonTable'
import { SkeletonChart } from '@/components/shared/SkeletonChart'
import { useI18n } from '@/lib/i18n'

const DAILY_CAPACITY_HOURS = 12

export default function ReportsPage() {
  const { t } = useI18n()
  const [filterType, setFilterType] = useState<string>('')
  const { data: utilization, isLoading: utilLoading } =
    useSpaceUtilization(filterType || undefined)
  const { data: dailyData, isLoading: dailyLoading } =
    useDailyReservations(filterType || undefined)

  const isLoading = utilLoading || dailyLoading

  const filteredUtilization = useMemo(() => {
    if (!utilization) return []
    return utilization
  }, [utilization])

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const handleExport = () => {
    if (filteredUtilization.length > 0) {
      exportToCSV(filteredUtilization)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('nav.reports')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {thirtyDaysAgo.toLocaleDateString('en-US')} -{' '}
            {new Date().toLocaleDateString('en-US')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">{t('reports.allTypes')}</option>
            <option value="desk">{t('spaceType.desk')}</option>
            <option value="meeting_room">{t('spaceType.meeting_room')}</option>
            <option value="phone_booth">{t('spaceType.phone_booth')}</option>
            <option value="event_space">{t('spaceType.event_space')}</option>
          </select>
          <button
            onClick={handleExport}
            disabled={filteredUtilization.length === 0}
            className="btn-primary"
          >
            {t('reports.exportCSV')}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <SkeletonTable rows={5} />
          <SkeletonChart />
          <SkeletonChart />
        </div>
      )}

      {!isLoading && filteredUtilization.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-muted-foreground">
            {t('reports.empty')}
          </p>
        </div>
      )}

      {!isLoading && filteredUtilization.length > 0 && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t('reports.space')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('reports.type')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('reports.reservations')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('reports.hoursBooked')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('reports.occupancy')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUtilization.map((row) => {
                  const rate = calculateOccupancyRate(
                    row.total_hours_booked,
                    DAILY_CAPACITY_HOURS
                  )
                  return (
                    <tr
                      key={row.space_id}
                      className="border-b border-border last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {row.space_type
                          ? t(`spaceType.${row.space_type}`)
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {row.total_reservations}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {row.total_hours_booked.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {rate !== null ? `${rate}%` : t('reports.na')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="card p-4">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              {t('reports.occupancyChart')}
            </h3>
            <div className="flex items-end gap-4">
              {filteredUtilization.slice(0, 10).map((row) => {
                const rate = calculateOccupancyRate(
                  row.total_hours_booked,
                  DAILY_CAPACITY_HOURS
                )
                const height = rate !== null ? `${Math.min(rate, 100)}%` : '0%'
                return (
                  <div
                    key={row.space_id}
                    className="flex flex-1 flex-col items-center"
                  >
                    <span className="mb-1 text-xs text-muted-foreground">
                      {rate !== null ? `${rate}%` : t('reports.na')}
                    </span>
                    <div
                      className="w-full rounded-t bg-primary transition-all duration-500"
                      style={{ height }}
                    >
                      <div className="h-full min-h-[4px] rounded-t" />
                    </div>
                    <span className="mt-1 text-[10px] text-muted-foreground truncate w-full text-center">
                      {row.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {dailyData && dailyData.length > 0 && (
            <div className="card p-4">
              <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                {t('reports.dailyChart')}
              </h3>
              <div className="flex items-end gap-1">
                {dailyData.map((d) => {
                  const maxCount = Math.max(
                    ...dailyData.map((x) => x.count),
                    1
                  )
                  const height = `${(d.count / maxCount) * 100}%`
                  return (
                    <div
                      key={d.date}
                      className="flex flex-1 flex-col items-center"
                    >
                      <span className="mb-1 text-[10px] text-muted-foreground">
                        {d.count}
                      </span>
                      <div
                        className="w-full rounded-t bg-secondary transition-all duration-500"
                        style={{ height }}
                      >
                        <div className="h-full min-h-[4px] rounded-t" />
                      </div>
                      <span className="mt-1 text-[8px] text-muted-foreground">
                        {new Date(d.date).getDate()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
