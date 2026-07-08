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
import { Download, BarChart3 } from 'lucide-react'
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Select,
  Button,
  EmptyState,
} from '@/components/ui'

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
      <PageHeader
        title={t('nav.reports')}
        subtitle={`${thirtyDaysAgo.toLocaleDateString('en-US')} - ${new Date().toLocaleDateString('en-US')}`}
        actions={
          <>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-9 w-44"
            >
              <option value="">{t('reports.allTypes')}</option>
              <option value="desk">{t('spaceType.desk')}</option>
              <option value="meeting_room">{t('spaceType.meeting_room')}</option>
              <option value="phone_booth">{t('spaceType.phone_booth')}</option>
              <option value="event_space">{t('spaceType.event_space')}</option>
            </Select>
            <Button
              onClick={handleExport}
              disabled={filteredUtilization.length === 0}
            >
              <Download className="h-4 w-4" />
              {t('reports.exportCSV')}
            </Button>
          </>
        }
      />

      {isLoading && (
        <div className="space-y-6">
          <SkeletonTable rows={5} />
          <SkeletonChart />
          <SkeletonChart />
        </div>
      )}

      {!isLoading && filteredUtilization.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title={t('reports.empty')}
          description={t('reports.emptyHint')}
        />
      )}

      {!isLoading && filteredUtilization.length > 0 && (
        <div className="space-y-6">
          <Table>
            <THead>
              <TR>
                <TH>{t('reports.space')}</TH>
                <TH>{t('reports.type')}</TH>
                <TH>{t('reports.reservations')}</TH>
                <TH>{t('reports.hoursBooked')}</TH>
                <TH>{t('reports.occupancy')}</TH>
              </TR>
            </THead>
            <TBody>
              {filteredUtilization.map((row) => {
                const rate = calculateOccupancyRate(
                  row.total_hours_booked,
                  DAILY_CAPACITY_HOURS
                )
                return (
                  <TR key={row.space_id} hoverable>
                    <TD className="font-medium">{row.name}</TD>
                    <TD className="text-muted-foreground">
                      {row.space_type ? t(`spaceType.${row.space_type}`) : '-'}
                    </TD>
                    <TD>{row.total_reservations}</TD>
                    <TD>{row.total_hours_booked.toFixed(1)}</TD>
                    <TD>{rate !== null ? `${rate}%` : t('reports.na')}</TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('reports.occupancyChart')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                {filteredUtilization.slice(0, 10).map((row) => {
                  const rate = calculateOccupancyRate(
                    row.total_hours_booked,
                    DAILY_CAPACITY_HOURS
                  )
                  const height = rate !== null ? `${Math.min(rate, 100)}%` : '0%'
                  return (
                    <div key={row.space_id} className="flex flex-1 flex-col items-center">
                      <span className="mb-1 text-xs text-muted-foreground">
                        {rate !== null ? `${rate}%` : t('reports.na')}
                      </span>
                      <div className="flex h-40 w-full items-end">
                        <div
                          className="w-full rounded-t bg-primary transition-all duration-500"
                          style={{ height }}
                        >
                          <div className="h-full min-h-[4px] rounded-t" />
                        </div>
                      </div>
                      <span className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground">
                        {row.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {dailyData && dailyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('reports.dailyChart')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-end gap-1">
                  {dailyData.map((d) => {
                    const maxCount = Math.max(...dailyData.map((x) => x.count), 1)
                    const height = `${(d.count / maxCount) * 100}%`
                    return (
                      <div key={d.date} className="flex flex-1 flex-col items-center justify-end">
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
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
