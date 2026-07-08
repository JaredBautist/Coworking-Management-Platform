import { useI18n } from '@/lib/i18n'
import { useRole } from '@/hooks/useRole'
import { PageHeader } from '@/components/ui'
import { ManagerDashboard } from './ManagerDashboard'
import { MemberDashboard } from './MemberDashboard'

export default function DashboardPage() {
  const { t } = useI18n()
  const { isOfficeManager } = useRole()

  return (
    <div>
      <PageHeader title={t('nav.dashboard')} />
      {isOfficeManager ? <ManagerDashboard /> : <MemberDashboard />}
    </div>
  )
}
