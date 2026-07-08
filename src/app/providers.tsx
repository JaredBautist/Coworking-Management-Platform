import { type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/query-client'
import { router } from './router'
import { ToastContainer } from '@/components/shared/Toast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { useAuth } from '@/hooks/useAuth'
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout'
import { useTheme } from '@/hooks/useTheme'

function ThemeProvider({ children }: { children: ReactNode }) {
  useTheme()
  return <>{children}</>
}

function AuthProvider({ children }: { children: ReactNode }) {
  useAuth()
  return <>{children}</>
}

function InactivityProvider({ children }: { children: ReactNode }) {
  useInactivityTimeout()
  return <>{children}</>
}

export function Providers() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <InactivityProvider>
              <RouterProvider router={router} future={{ v7_startTransition: true }} />
              <ToastContainer />
            </InactivityProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
