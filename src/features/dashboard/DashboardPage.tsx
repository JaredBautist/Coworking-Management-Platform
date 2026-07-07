import { useI18n } from '@/lib/i18n'
import { useRole } from '@/hooks/useRole'
import { ManagerDashboard } from './ManagerDashboard'
import { MemberDashboard } from './MemberDashboard'

export default function DashboardPage() {
  const { t } = useI18n()
  const { isOfficeManager } = useRole()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{t('nav.dashboard')}</h1>
      {isOfficeManager ? <ManagerDashboard /> : <MemberDashboard />}
    </div>
  )
}
