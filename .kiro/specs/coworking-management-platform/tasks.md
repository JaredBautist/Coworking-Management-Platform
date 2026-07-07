# Implementation Plan

## Overview

Implementación del frontend SPA de la Coworking Management Platform con React 18 + TypeScript. El plan sigue una progresión incremental: infraestructura base → autenticación → onboarding → módulos de negocio → integración Realtime → testing de propiedades. Cada módulo incluye sus property tests correspondientes. Los puntos de control garantizan validación incremental por etapa.

## Tasks

- [x] 1. Inicializar proyecto y configurar infraestructura base
  - Crear proyecto con Vite + React 18 + TypeScript
  - Instalar dependencias: `react-router-dom@6`, `@tanstack/react-query@5`, `zustand`, `@supabase/supabase-js@2`, `react-hook-form`, `zod`, `tailwindcss@3`, `recharts`, `@fullcalendar/react`, `shadcn/ui`, `vitest`, `@testing-library/react`, `fast-check`, `msw`
  - Crear estructura de carpetas: `src/app/`, `src/lib/`, `src/features/`, `src/components/`, `src/hooks/`, `src/stores/`, `src/types/`, `src/test/`
  - Configurar `tailwind.config.ts` con design tokens: colores `primary`, `secondary`, `accent`, `destructive`, `background`, `surface`, `border`, `muted`
  - Configurar tipografía Inter (headings/body) y JetBrains Mono (code)
  - Configurar Vitest con `src/test/setup.ts` e integrar `fast-check` con `numRuns: 100`
  - _Requirements: 10.1, 10.7, 10.8_

- [x] 2. Crear tipos globales, cliente Supabase y utilidades base
  - [x] 2.1 Crear `src/types/index.ts` con: `UserRole`, `SpaceType`, `ReservationStatus`, `Organization`, `Profile`, `Space`, `Reservation`, `SpaceUtilization`, `AuthUser`, `SpaceFormData`, `ReservationSearchParams`
    - _Requirements: 1.2, 4.2, 6.1, 8.1, 9.1_
  - [x] 2.2 Crear `src/lib/supabase/client.ts` con cliente singleton: `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`
    - _Requirements: 1.5_
  - [x] 2.3 Crear `src/lib/utils.ts` con `parseSupabaseError` que mapea códigos Supabase a mensajes en español
    - _Requirements: 4.9, 2.4, 6.4_
  - [x] 2.4 Crear `src/lib/query-client.ts` con TanStack Query configurado con handler global `onError` (toast por defecto)
    - _Requirements: 10.5_

- [x] 3. Implementar stores de Zustand y hooks globales
  - [x] 3.1 Crear `src/stores/authStore.ts` con `AuthState` (session, profile, isLoading) usando `persist`
    - _Requirements: 1.5, 1.6_
  - [x] 3.2 Crear `src/stores/uiStore.ts` para estado de UI global (toasts, filtros activos para restauración)
    - _Requirements: 10.4, 10.5, 10.10_
  - [x] 3.3 Crear `src/hooks/useAuth.ts`, `src/hooks/useRole.ts` y `src/hooks/useDebounce.ts` (debounce 300ms)
    - _Requirements: 9.8_
  - [x] 3.4 Crear `src/hooks/useInactivityTimeout.ts` que escucha `mousemove`, `keydown`, `click`, `scroll` y llama `supabase.auth.signOut()` tras 60 minutos de inactividad
    - _Requirements: 1.4_

- [x] 4. Implementar componentes de layout y shell de la aplicación
  - [x] 4.1 Crear `src/components/layout/AppShell.tsx`, `Sidebar.tsx` y `TopBar.tsx`; el TopBar muestra nombre completo y rol en todas las vistas
    - _Requirements: 3.5_
  - [x] 4.2 Crear `src/components/shared/Toast.tsx`: éxito (4s auto), error (8s o manual), info (4s), advertencia (6s)
    - _Requirements: 10.4, 10.5_
  - [x] 4.3 Crear skeletons: `SkeletonCard.tsx`, `SkeletonTable.tsx`, `SkeletonChart.tsx`, `SkeletonCalendar.tsx`, `SkeletonPanel.tsx`; aparecer si operación tarda ≥ 301ms vía `setTimeout` de 300ms
    - _Requirements: 10.3_
  - [x] 4.4 Crear `src/components/shared/ConfirmDialog.tsx` y `AccessDeniedMessage.tsx`
    - _Requirements: 4.7, 9.5, 4.10, 8.6, 9.7_
  - [x] 4.5 Crear `src/components/shared/ErrorBoundary.tsx` con opción "Reintentar"
    - _Requirements: 10.5_
  - [x]* 4.6 Escribir tests de propiedad para loading state (Property 21)
    - **Property 21: Loading state para operaciones ≥ 301ms**
    - **Validates: Requirements 10.3**
    - Archivo: `src/test/properties/ux.property.test.ts`

- [x] 5. Implementar routing y guards de ruta
  - [x] 5.1 Crear `src/app/router.tsx` con rutas públicas (`/login`, `/forgot-password`), `/onboarding` y rutas bajo `/app/` con sus guards
    - _Requirements: 1.8, 4.10, 8.6, 9.7_
  - [x] 5.2 Implementar `RequireAuth` (redirige a `/login`), `RequireRole` (redirige a `/app/dashboard`) y `RequireOnboarding` (redirige a `/onboarding`)
    - _Requirements: 1.8, 2.7, 4.10, 8.6, 9.7_
  - [x]* 5.3 Escribir tests de propiedad para guards de ruta (Properties 1 y 2)
    - **Property 1: Redirección post-login determinada por rol**
    - **Property 2: Guard de rutas redirige usuarios no autenticados**
    - **Validates: Requirements 1.2, 1.8**
    - Archivo: `src/test/properties/auth.property.test.ts`
  - [x] 5.4 Crear `src/app/providers.tsx` con QueryClientProvider, AuthProvider y activación de `useInactivityTimeout`
    - _Requirements: 1.4, 1.5_

- [x] 6. Punto de control — Verificar infraestructura base
  - Confirmar que el proyecto compila sin errores TypeScript, la estructura de carpetas está completa, Vitest corre y los guards de ruta funcionan correctamente.

- [x] 7. Implementar módulo de autenticación
  - [x] 7.1 Crear `features/auth/LoginPage.tsx` con `LoginForm`: campos email/contraseña, error genérico, enlace a recuperación y bloqueo tras 5 intentos (5 min con cuenta regresiva)
    - _Requirements: 1.1, 1.3, 1.9_
  - [x] 7.2 Implementar lógica de login: `supabase.auth.signInWithPassword()`, guardar sesión/perfil en `authStore`, redirigir según rol
    - _Requirements: 1.2_
  - [x] 7.3 Crear `features/auth/ForgotPasswordPage.tsx` con formulario de recuperación y confirmación de envío
    - _Requirements: 1.7_
  - [x] 7.4 Implementar cierre de sesión: `supabase.auth.signOut()` y redirección a `/login`
    - _Requirements: 1.6_
  - [x]* 7.5 Escribir tests unitarios para login: error genérico, bloqueo por intentos, redirección por rol
    - _Requirements: 1.2, 1.3, 1.9_

- [x] 8. Implementar módulo de onboarding
  - [x] 8.1 Crear `features/onboarding/OnboardingPage.tsx` con indicador de progreso (paso 1/2), `StepOrgName` y `StepFirstSpace`
    - _Requirements: 2.1_
  - [x] 8.2 Implementar `StepOrgName`: validación Zod (2–100 chars), error inline, persistencia de progreso para reanudar si la sesión expira
    - _Requirements: 2.2, 2.6_
  - [x] 8.3 Implementar `StepFirstSpace`: nombre (2–100 chars) y tipo requeridos, error inline, conservar datos en fallo del servidor con opción de reintento
    - _Requirements: 2.3, 2.4_
  - [x] 8.4 Implementar redirección al dashboard tras onboarding; omitir onboarding para `member` con espacios existentes
    - _Requirements: 2.5, 2.7_
  - [x]* 8.5 Escribir tests de propiedad para validación de longitud de cadenas (Property 3)
    - **Property 3: Validación de longitud de cadenas en formularios**
    - **Validates: Requirements 2.2, 2.3**
    - Archivo: `src/test/properties/validation.property.test.ts`

- [x] 9. Implementar módulo de gestión de espacios (Space_Manager)
  - [x] 9.1 Crear `features/spaces/schemas.ts` con `SpaceFormSchema` (Zod): nombre 2–100, tipo enum, capacidad 1–500, is_active boolean
    - _Requirements: 4.2_
  - [x]* 9.2 Escribir tests de propiedad para validación de SpaceFormData (Property 4)
    - **Property 4: Validación de SpaceFormData completa**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - Archivo: `src/test/properties/validation.property.test.ts`
  - [x] 9.3 Crear `features/spaces/hooks.ts`: `useSpaces()` (staleTime 30s), `useCreateSpace()`, `useUpdateSpace()`
    - _Requirements: 4.3, 4.5_
  - [x] 9.4 Crear `features/spaces/SpacesPage.tsx` con `SpaceTable` paginada (25/página): nombre, tipo, capacidad, estado
    - _Requirements: 4.1_
  - [x]* 9.5 Escribir tests de propiedad para paginación (Property 5)
    - **Property 5: Paginación — ítems por página nunca excede 25**
    - **Validates: Requirements 4.1, 9.1**
    - Archivo: `src/test/properties/spaces.property.test.ts`
  - [x] 9.6 Crear `features/spaces/SpaceFormPage.tsx`: React Hook Form + Zod, validación inline, error del servidor conservando datos
    - _Requirements: 4.2, 4.4, 4.5, 4.9_
  - [x] 9.7 Implementar `DeactivateDialog`: mostrar nº reservas futuras afectadas, confirmar desactivación y cancelar todas las reservas futuras del espacio
    - _Requirements: 4.6, 4.7, 4.8_
  - [x]* 9.8 Escribir tests de propiedad para desactivación de espacios (Property 6)
    - **Property 6: Desactivación de espacio — count y cancelación correctos**
    - **Validates: Requirements 4.7, 4.8**
    - Archivo: `src/test/properties/spaces.property.test.ts`

- [x] 10. Implementar Sistema de Reservas — Búsqueda de disponibilidad
  - [x] 10.1 Crear `features/reservations/schemas.ts` con `ReservationSearchSchema` (fecha no pasada, `end_time > start_time`, `min_capacity` 1–999 opcional) y función `filterAvailableSpaces` con lógica `existing_start < requested_end AND existing_end > requested_start`
    - _Requirements: 5.1, 5.2, 5.5, 5.6_
  - [x]* 10.2 Escribir tests de propiedad para detección de solapamiento (Property 7)
    - **Property 7: Detección de solapamiento de reservas**
    - **Validates: Requirements 5.2**
    - Archivo: `src/test/properties/overlap.property.test.ts`
  - [x]* 10.3 Escribir tests de propiedad para ignorar filtro de capacidad fuera de rango (Property 8)
    - **Property 8: Ignorar filtro de capacidad fuera de rango**
    - **Validates: Requirements 5.3**
    - Archivo: `src/test/properties/overlap.property.test.ts`
  - [x]* 10.4 Escribir tests de propiedad para validación del schema de búsqueda (Property 9)
    - **Property 9: Validación del schema de búsqueda**
    - **Validates: Requirements 5.5, 5.6**
    - Archivo: `src/test/properties/validation.property.test.ts`
  - [x] 10.5 Crear `features/reservations/hooks.ts` con `useAvailableSpaces(params)`: filtro de solapamiento exacto en query, excluir ids ocupados, aplicar filtros de tipo y capacidad (ignorar fuera de [1,999])
    - _Requirements: 5.2, 5.3_
  - [x] 10.6 Crear `features/reservations/SearchPage.tsx`: `SearchForm` (DatePicker, TimeRangePicker, SpaceTypeSelect, CapacityInput), `SearchResults` con `SpaceCard`/`BookButton`, `NoResultsMessage` con hasta 3 franjas alternativas en ±24h
    - _Requirements: 5.1, 5.4_

- [x] 11. Implementar Sistema de Reservas — Creación y cancelación
  - [x] 11.1 Implementar `ConfirmationPanel`: detalles de reserva (espacio, fecha, inicio, fin, capacidad), `ConfirmButton`, `BackButton`; insertar con `status = confirmed`, toast ≥ 3s
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 11.2 Implementar detección de conflicto concurrente: verificar disponibilidad antes del `insert`; si hay conflicto, bloquear operación y eliminar espacio conflictivo de resultados
    - _Requirements: 6.4_
  - [x]* 11.3 Escribir tests de propiedad para prevención de conflictos concurrentes (Property 10)
    - **Property 10: Prevención de conflictos concurrentes**
    - **Validates: Requirements 6.4**
    - Archivo: `src/test/properties/overlap.property.test.ts`
  - [x] 11.4 Crear `features/reservations/ReservationsPage.tsx`: `ReservationTabs` (Próximas/Pasadas), lista ordenada por `start_time` asc, `CancelButton` solo para `confirmed` y `start_time > now`; rechazar cancelación de pasadas sin llamar a Supabase
    - _Requirements: 6.5, 6.7, 6.8_
  - [x]* 11.5 Escribir tests de propiedad para rechazo de cancelación de pasadas (Property 11)
    - **Property 11: Rechazo de cancelación de reservas pasadas**
    - **Validates: Requirements 6.7**
    - Archivo: `src/test/properties/reservations.property.test.ts`
  - [x]* 11.6 Escribir tests de propiedad para ordenación ascendente (Property 12)
    - **Property 12: Ordenación ascendente de reservas**
    - **Validates: Requirements 6.8**
    - Archivo: `src/test/properties/reservations.property.test.ts`

- [x] 12. Punto de control — Verificar módulos de espacios y reservas
  - Confirmar que el flujo búsqueda → selección → confirmación → cancelación funciona, los guards redirigen correctamente y los schemas Zod validan conforme a las propiedades.

- [x] 13. Implementar Vista de Calendario (Calendar_View)
  - [x] 13.1 Crear `features/calendar/CalendarPage.tsx` con `CalendarToolbar` (día/semana/mes) y `FullCalendarWrapper`; cambio de modo en < 500ms
    - _Requirements: 7.1, 7.2_
  - [x] 13.2 Implementar `EventBlock`: reservas propias en `#4F46E5` (indigo), otros en `#0EA5E9` (sky), ambos con contraste WCAG AA ≥ 4.5:1; resaltar bloques libres 08:00–20:00
    - _Requirements: 7.3, 7.8_
  - [x] 13.3 Implementar `EventDetailPanel`: para `office_manager` mostrar espacio, reservante, inicio, fin, estado; para `member` mostrar solo tipo de espacio e intervalo sin datos personales
    - _Requirements: 7.5, 7.6, 7.7_
  - [x]* 13.4 Escribir tests de propiedad para privacidad de datos (Property 13)
    - **Property 13: Privacidad de datos en Calendar_View para member**
    - **Validates: Requirements 7.7**
    - Archivo: `src/test/properties/calendar.property.test.ts`

- [x] 14. Implementar suscripciones Supabase Realtime
  - [x] 14.1 Crear `src/lib/supabase/realtime.ts` con `subscribeToOrgReservations(orgId, onEvent)` escuchando `postgres_changes` en `reservations` filtrado por `org_id`
    - _Requirements: 3.3, 7.4_
  - [x] 14.2 Crear `useReservationRealtime()` que al recibir eventos invalida queries `['reservations']` y `['available-spaces']`; integrar en `AppShell`
    - _Requirements: 3.3, 6.6, 7.4_
  - [x] 14.3 Conectar Realtime al Dashboard (métricas en ≤ 5s) y Calendar_View (actualizaciones en ≤ 3s)
    - _Requirements: 3.3, 7.4_

- [x] 15. Implementar Dashboard diferenciado por rol
  - [x] 15.1 Crear `features/dashboard/ManagerDashboard.tsx`: `MetricCard` para espacios activos, reservas del día y tasa de ocupación (1 decimal); enlace a reportes y `RealtimeIndicator`
    - _Requirements: 3.1_
  - [x] 15.2 Crear `features/dashboard/MemberDashboard.tsx`: `UpcomingReservationsList` (máx. 5, ordenadas asc), `QuickSearchForm` y enlace a `Calendar_View`
    - _Requirements: 3.2_
  - [x] 15.3 Crear `features/dashboard/DashboardPage.tsx` que renderiza el dashboard según rol del usuario autenticado
    - _Requirements: 3.1, 3.2_

- [x] 16. Implementar módulo de Reportes (Report_Module)
  - [x] 16.1 Crear `features/reports/hooks.ts`: query a `space_utilization`; función de ocupación `round((hours / (daily_hours * 30)) * 100, 1)`, retornar `null` si `daily_hours = 0`
    - _Requirements: 8.1, 8.2_
  - [x]* 16.2 Escribir tests de propiedad para cálculo de tasa de ocupación (Property 14)
    - **Property 14: Cálculo de tasa de ocupación**
    - **Validates: Requirements 8.2**
    - Archivo: `src/test/properties/reports.property.test.ts`
  - [x] 16.3 Implementar `DailyReservationsLineChart`: exactamente 30 puntos (días calendario); días sin reservas con valor `0`
    - _Requirements: 8.3_
  - [x]* 16.4 Escribir tests de propiedad para completitud de serie temporal (Property 15)
    - **Property 15: Completitud de serie temporal de 30 días**
    - **Validates: Requirements 8.3**
    - Archivo: `src/test/properties/reports.property.test.ts`
  - [x] 16.5 Crear `features/reports/ReportsPage.tsx`: `ReportsHeader`, `SpaceTypeFilter`, `UtilizationTable`, `OccupancyBarChart`, `DailyReservationsLineChart`, `ExportCSVButton`, `EmptyReportsMessage`; actualizar en ≤ 2s al cambiar filtro
    - _Requirements: 8.1, 8.4, 8.7, 8.8_
  - [x]* 16.6 Escribir tests de propiedad para filtrado correcto por tipo (Property 16)
    - **Property 16: Filtrado correcto por tipo de espacio en Reporting**
    - **Validates: Requirements 8.4**
    - Archivo: `src/test/properties/reports.property.test.ts`
  - [x] 16.7 Implementar `ExportCSVButton`: generar CSV con columnas `space_id, name, org_id, total_reservations, total_hours_booked, space_type` según filtro activo
    - _Requirements: 8.5_
  - [x]* 16.8 Escribir tests de propiedad para CSV exportado (Property 17)
    - **Property 17: CSV refleja filtro activo y columnas requeridas**
    - **Validates: Requirements 8.5**
    - Archivo: `src/test/properties/reports.property.test.ts`

- [x] 17. Implementar módulo de gestión del equipo (Team_Manager)
  - [x] 17.1 Crear `features/team/hooks.ts`: `useTeamMembers()` (paginada 25/página) y `useUpdateMemberRole()` (con reversión optimista en error)
    - _Requirements: 9.1, 9.9_
  - [x] 17.2 Crear `features/team/TeamPage.tsx`: `TeamHeader` (total miembros), `TeamSearch` (debounce 300ms), `TeamTable` con `RoleSelector` y `TeamPagination`
    - _Requirements: 9.1, 9.4, 9.8_
  - [x]* 17.3 Escribir tests de propiedad para indicador de total de miembros (Property 18)
    - **Property 18: Indicador de total de miembros**
    - **Validates: Requirements 9.4**
    - Archivo: `src/test/properties/team.property.test.ts`
  - [x] 17.4 Implementar lógica de cambio de rol: solo `office_manager` puede promover/degradar; bloquear degradación del último manager; mostrar `SelfDemoteDialog` al auto-degradarse
    - _Requirements: 9.2, 9.3, 9.5, 9.6_
  - [x]* 17.5 Escribir tests de propiedad para bloqueo de último office_manager (Property 19)
    - **Property 19: Bloqueo de degradación del último office_manager**
    - **Validates: Requirements 9.6**
    - Archivo: `src/test/properties/team.property.test.ts`
  - [x]* 17.6 Escribir tests de propiedad para reversión de rol en fallo (Property 20)
    - **Property 20: Reversión de rol cuando falla el cambio**
    - **Validates: Requirements 9.9**
    - Archivo: `src/test/properties/team.property.test.ts`

- [x] 18. Punto de control — Verificar módulos de negocio completos
  - Confirmar que todos los módulos renderizan correctamente, los guards de rol funcionan, Realtime actualiza en los tiempos especificados y los property tests pasan.

- [x] 19. Responsividad, accesibilidad y optimizaciones finales
  - [x] 19.1 Aplicar layouts responsivos: colapsar a una columna en < 768px; todos los controles accesibles sin scroll horizontal
    - _Requirements: 3.4, 10.9_
  - [x] 19.2 Implementar restauración de filtros al navegar atrás: guardar filtros activos de `SearchPage`, `ReportsPage` y `TeamPage` en `uiStore` (o URL params); restaurar al volver
    - _Requirements: 10.10_
  - [x]* 19.3 Escribir tests de propiedad para restauración de filtros (Property 22)
    - **Property 22: Restauración de filtros al navegar atrás**
    - **Validates: Requirements 10.10**
    - Archivo: `src/test/properties/ux.property.test.ts`
  - [x] 19.4 Auditar accesibilidad WCAG 2.1 AA: contraste ≥ 4.5:1, navegación por teclado completa, atributos ARIA en modales, diálogos y selects
    - _Requirements: 10.2_
  - [x] 19.5 Configurar code splitting en Vite para `features/reports`, `features/calendar`, `features/team`; verificar bundle gzip ≤ 250KB con `vite build --report`
    - _Requirements: 10.8_

- [x] 20. Punto de control final — Verificar todos los tests y requisitos
  - Ejecutar `vitest --run` para confirmar que todos los property tests y unitarios pasan. Verificar bundle gzip ≤ 250KB. Revisar cobertura de requerimientos.

## Notes

- Las tareas marcadas con `*` son property tests opcionales pero recomendados para garantizar corrección formal
- Cada tarea referencia requerimientos específicos (`_Requirements: X.Y_`) para trazabilidad completa
- Los puntos de control (tareas 6, 12, 18, 20) garantizan validación incremental antes de avanzar
- Los property tests usan `fast-check` con mínimo 100 iteraciones (`numRuns: 100`)
- Los guards `RequireAuth` y `RequireRole` deben aplicarse a todas las rutas bajo `/app/`
- Las suscripciones Realtime deben limpiarse en el `cleanup` del `useEffect` para evitar fugas de memoria
- La arquitectura sigue el patrón: Componente → TanStack Query → Supabase Client; estado UI global en Zustand

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 4, "tasks": ["4.6", "5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3", "5.4"] },
    { "id": 6, "tasks": ["6"] },
    { "id": 7, "tasks": ["7.1", "7.2", "7.3", "7.4"] },
    { "id": 8, "tasks": ["7.5", "8.1"] },
    { "id": 9, "tasks": ["8.2", "8.3", "8.4", "9.1"] },
    { "id": 10, "tasks": ["8.5", "9.2", "9.3", "9.4"] },
    { "id": 11, "tasks": ["9.5", "9.6", "9.7"] },
    { "id": 12, "tasks": ["9.8", "10.1"] },
    { "id": 13, "tasks": ["10.2", "10.3", "10.4", "10.5"] },
    { "id": 14, "tasks": ["10.6", "11.1", "11.2"] },
    { "id": 15, "tasks": ["11.3", "11.4"] },
    { "id": 16, "tasks": ["11.5", "11.6", "12"] },
    { "id": 17, "tasks": ["13.1", "14.1"] },
    { "id": 18, "tasks": ["13.2", "14.2"] },
    { "id": 19, "tasks": ["13.3", "13.4", "14.3"] },
    { "id": 20, "tasks": ["15.1", "15.2"] },
    { "id": 21, "tasks": ["15.3", "16.1"] },
    { "id": 22, "tasks": ["16.2", "16.3", "17.1"] },
    { "id": 23, "tasks": ["16.4", "16.5", "17.2"] },
    { "id": 24, "tasks": ["16.6", "16.7", "17.3", "17.4"] },
    { "id": 25, "tasks": ["16.8", "17.5", "17.6", "18"] },
    { "id": 26, "tasks": ["19.1", "19.2", "19.4", "19.5"] },
    { "id": 27, "tasks": ["19.3", "20"] }
  ]
}
```
