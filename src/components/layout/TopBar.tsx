import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase/client'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
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

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const profile = useAuthStore((s) => s.profile)
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onMenuClick}
          aria-label={t('nav.dashboard')}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-base font-semibold text-foreground">
          {t(usePageTitleKey(location.pathname))}
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          aria-label={profile ? `${t('common.logout')} — ${profile.full_name}` : t('common.logout')}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t('common.logout')}</span>
        </Button>
      </div>
    </header>
  )
}
