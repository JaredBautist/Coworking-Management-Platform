import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useI18n, type TranslationKey } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Button } from '@/components/ui'

function usePageTitleKey(pathname: string): TranslationKey {
  if (pathname.startsWith('/app/spaces/new')) return 'spaces.new'
  if (pathname.includes('/app/spaces/') && pathname.endsWith('/edit')) return 'spaces.edit'
  if (pathname.startsWith('/app/spaces')) return 'nav.spaces'
  if (pathname.startsWith('/app/reservations/search')) return 'nav.search'
  if (pathname.startsWith('/app/reservations')) return 'nav.reservations'
  if (pathname.startsWith('/app/calendar')) return 'nav.calendar'
  if (pathname.startsWith('/app/reports')) return 'nav.reports'
  if (pathname.startsWith('/app/team')) return 'nav.team'
  return 'nav.dashboard'
}

export function TopBar() {
  const profile = useAuthStore((s) => s.profile)
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur">
      <h1 className="text-base font-semibold text-foreground">
        {t(usePageTitleKey(location.pathname))}
      </h1>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <LanguageSwitcher />
        <div className="h-6 w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          aria-label={profile ? `${t('common.logout')} — ${profile.full_name}` : t('common.logout')}
        >
          <LogOut className="h-4 w-4" />
          {t('common.logout')}
        </Button>
      </div>
    </header>
  )
}
