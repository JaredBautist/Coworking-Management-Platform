import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useRole } from '@/hooks/useRole'
import { AppShell } from '@/components/layout/AppShell'
import type { ComponentType, ReactNode } from 'react'

const lazyPage = (importer: () => Promise<{ default: ComponentType }>) =>
  async () => {
    const module = await importer()
    return { Component: module.default }
  }

function FullPageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />

  return <>{children}</>
}

function RequireRole({ role, children }: { role: string; children: ReactNode }) {
  const { isOfficeManager, isMember } = useRole()
  const profile = useAuthStore((s) => s.profile)

  if (!profile) return null

  const hasRole =
    role === 'office_manager' ? isOfficeManager : isMember

  if (!hasRole) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}

export function RequireOnboarding({ children }: { children: ReactNode }) {
  const profile = useAuthStore((s) => s.profile)

  if (!profile) return null

  if (profile.role === 'office_manager') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuthStore()

  if (isLoading) return <FullPageSpinner />
  if (session) return <Navigate to="/app/dashboard" replace />

  return <>{children}</>
}

const routes = [
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Outlet />
      </PublicRoute>
    ),
    children: [
      { index: true, lazy: lazyPage(() => import('@/features/auth/LoginPage')) },
    ],
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <Outlet />
      </PublicRoute>
    ),
    children: [
      { index: true, lazy: lazyPage(() => import('@/features/auth/ForgotPasswordPage')) },
    ],
  },
  {
    path: '/signup',
    element: (
      <PublicRoute>
        <Outlet />
      </PublicRoute>
    ),
    children: [
      { index: true, lazy: lazyPage(() => import('@/features/auth/SignUpPage')) },
    ],
  },
  {
    path: '/onboarding',
    element: (
      <RequireAuth>
        <Outlet />
      </RequireAuth>
    ),
    children: [
      { index: true, lazy: lazyPage(() => import('@/features/onboarding/OnboardingPage')) },
    ],
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'dashboard',
        lazy: lazyPage(() => import('@/features/dashboard/DashboardPage')),
      },
      {
        path: 'spaces',
        element: (
          <RequireRole role="office_manager">
            <Outlet />
          </RequireRole>
        ),
        children: [
        { index: true, lazy: lazyPage(() => import('@/features/spaces/SpacesPage')) },
          {
            path: 'new',
          lazy: lazyPage(() => import('@/features/spaces/SpaceFormPage')),
          },
          {
            path: ':id/edit',
          lazy: lazyPage(() => import('@/features/spaces/SpaceFormPage')),
          },
        ],
      },
      {
        path: 'reservations',
        children: [
        { index: true, lazy: lazyPage(() => import('@/features/reservations/ReservationsPage')) },
          {
            path: 'search',
          lazy: lazyPage(() => import('@/features/reservations/SearchPage')),
          },
        ],
      },
      {
        path: 'calendar',
        lazy: lazyPage(() => import('@/features/calendar/CalendarPage')),
      },
      {
        path: 'reports',
        element: (
          <RequireRole role="office_manager">
            <Outlet />
          </RequireRole>
        ),
        children: [
        { index: true, lazy: lazyPage(() => import('@/features/reports/ReportsPage')) },
        ],
      },
      {
        path: 'team',
        element: (
          <RequireRole role="office_manager">
            <Outlet />
          </RequireRole>
        ),
        children: [
        { index: true, lazy: lazyPage(() => import('@/features/team/TeamPage')) },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]

export const router = createBrowserRouter(routes)
