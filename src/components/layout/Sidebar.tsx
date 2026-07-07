import { NavLink } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { cn } from '@/lib/utils'
import { useI18n, type TranslationKey } from '@/lib/i18n'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  Building2,
  BarChart3,
} from 'lucide-react'

const navItems: Array<{
  to: string
  labelKey: TranslationKey
  icon: typeof LayoutDashboard
  roles: string[]
}> = [
  { to: '/app/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, roles: ['office_manager', 'member'] },
  { to: '/app/spaces', labelKey: 'nav.spaces', icon: Building2, roles: ['office_manager'] },
  { to: '/app/reservations', labelKey: 'nav.reservations', icon: ClipboardList, roles: ['office_manager', 'member'] },
  { to: '/app/reservations/search', labelKey: 'nav.search', icon: Calendar, roles: ['office_manager', 'member'] },
  { to: '/app/calendar', labelKey: 'nav.calendar', icon: Calendar, roles: ['office_manager', 'member'] },
  { to: '/app/reports', labelKey: 'nav.reports', icon: BarChart3, roles: ['office_manager'] },
  { to: '/app/team', labelKey: 'nav.team', icon: Users, roles: ['office_manager'] },
]

export function Sidebar() {
  const { role } = useRole()
  const { t } = useI18n()

  const visibleItems = navItems.filter(
    (item) => role && item.roles.includes(role)
  )

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-surface">
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
