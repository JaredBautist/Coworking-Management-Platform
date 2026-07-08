import { useAuthStore } from '@/stores/authStore'
import { useRole } from '@/hooks/useRole'
import { supabase } from '@/lib/supabase/client'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

export function TopBar() {
  const profile = useAuthStore((s) => s.profile)
  const { role } = useRole()
  const navigate = useNavigate()
  const { t } = useI18n()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div>
        <h1 className="text-lg font-semibold text-primary">
          {t('app.name')}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {profile && (
          <div className="text-right">
            <p className="text-sm font-medium">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {role === 'office_manager'
                ? t('role.office_manager')
                : role === 'member'
                  ? t('role.member')
                  : role}
            </p>
          </div>
        )}
        <LanguageSwitcher />
        <button
          onClick={handleLogout}
          className="btn-ghost"
        >
          {t('common.logout')}
        </button>
      </div>
    </header>
  )
}
