import { type ReactNode } from 'react'
import { Boxes } from 'lucide-react'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { Card, CardContent } from '@/components/ui'
import { cn } from '@/lib/utils'

interface AuthShellProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: 'sm' | 'md'
  center?: boolean
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'sm',
  center = false,
}: AuthShellProps) {
  return (
    <div className="auth-gradient flex min-h-screen items-center justify-center p-4">
      <div className={cn('w-full', maxWidth === 'md' ? 'max-w-md' : 'max-w-sm')}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <LanguageSwitcher />
        </div>
        <Card className="shadow-elevated">
          <CardContent className={cn('p-8', center && 'text-center')}>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-4">{footer}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
