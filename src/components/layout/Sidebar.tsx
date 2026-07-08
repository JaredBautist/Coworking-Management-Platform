import { NavLink } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useI18n, type TranslationKey } from '@/lib/i18n'
import { Avatar } from '@/components/ui'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Building2,
  BarChart3,
  Search,
  Boxes,
} from 'lucide-react'

type NavItem = {
  to: string
  labelKey: TranslationKey
  icon: typeof LayoutDashboard
  roles: string[]
  end?: boolean
}

const navSections: Array<{ titleKey: TranslationKey; items: NavItem[] }> = [
  {
    titleKey: 'nav.section.general',
    items: [
      { to: '/app/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, roles: ['office_manager', 'member'] },
      { to: '/app/reservations', labelKey: 'nav.reservations', icon: ClipboardList, roles: ['office_manager', 'member'], end: true },
      { to: '/app/reservations/search', labelKey: 'nav.search', icon: Search, roles: ['office_manager', 'member'] },
      { to: '/app/calendar', labelKey: 'nav.calendar', icon: CalendarDays, roles: ['office_manager', 'member'] },
    ],
  },
  {
    titleKey: 'nav.section.management',
    items: [
      { to: '/app/spaces', labelKey: 'nav.spaces', icon: Building2, roles: ['office_manager'] },
      { to: '/app/reports', labelKey: 'nav.reports', icon: BarChart3, roles: ['office_manager'] },
      { to: '/app/team', labelKey: 'nav.team', icon: Users, roles: ['office_manager'] },
    ],
  },
]

export function Sidebar() {
  const { role } = useRole()
  const { t } = useI18n()
  const profile = useAuthStore((s) => s.profile)

  const sections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => role && item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Boxes className="h-5 w-5" />
        </div>
        <span className="text-sm font-semibold text-foreground">{t('app.name')}</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {sections.map((section) => (
          <div key={section.titleKey} className="space-y-1">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {t(section.titleKey)}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <item.icon className="h-4 w-4 shrink-0" />
                    {t(item.labelKey)}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {profile && (
        <div className="flex items-center gap-3 border-t border-border p-4">
          <Avatar name={profile.full_name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {profile.full_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {role === 'office_manager'
                ? t('role.office_manager')
                : t('role.member')}
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
