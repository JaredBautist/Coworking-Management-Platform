import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpaces } from './hooks'
import { SkeletonTable } from '@/components/shared/SkeletonTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/stores/uiStore'
import { Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const ITEMS_PER_PAGE = 25

export default function SpacesPage() {
  const { t } = useI18n()
  const { data: spaces, isLoading } = useSpaces()
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const [page, setPage] = useState(1)
  const [deactivateTarget, setDeactivateTarget] = useState<{
    id: string
    name: string
    futureReservations: number
  } | null>(null)

  if (isLoading) return <SkeletonTable rows={5} />

  const totalPages = Math.ceil((spaces?.length ?? 0) / ITEMS_PER_PAGE)
  const paginatedSpaces =
    spaces?.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE) ?? []

  const handleDeactivate = async (spaceId: string) => {
    if (!deactivateTarget) return

    if (deactivateTarget.futureReservations > 0) {
      const { error: cancelError } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('space_id', spaceId)
        .eq('status', 'confirmed')
        .gte('start_time', new Date().toISOString())

      if (cancelError) {
        addToast({ type: 'error', message: t('spaces.cancelError') })
        return
      }
    }

    const { error } = await supabase
      .from('spaces')
      .update({ is_active: false })
      .eq('id', spaceId)

    if (error) {
      addToast({ type: 'error', message: t('spaces.deactivateError') })
      return
    }

    queryClient.invalidateQueries({ queryKey: ['spaces'] })
    addToast({ type: 'success', message: t('spaces.deactivatedSuccess') })
    setDeactivateTarget(null)
  }

  const checkFutureReservations = async (spaceId: string, spaceName: string) => {
    const { count } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('space_id', spaceId)
      .eq('status', 'confirmed')
      .gte('start_time', new Date().toISOString())

    setDeactivateTarget({
      id: spaceId,
      name: spaceName,
      futureReservations: count ?? 0,
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{t('nav.spaces')}</h1>
        <Link
          to="/app/spaces/new"
          className="btn-primary gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('spaces.new')}
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                {t('common.name')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                {t('common.type')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                {t('common.capacity')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                {t('common.status')}
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paginatedSpaces.map((space, i) => (
              <tr key={space.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/50" style={{ animationDelay: `${i * 30}ms` }}>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{space.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {t(`spaceType.${space.type}`)}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {space.capacity}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      space.is_active
                        ? 'bg-primary/10 text-primary'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {space.is_active ? t('common.active') : t('common.inactive')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/app/spaces/${space.id}/edit`}
                      className="btn-ghost"
                    >
                      {t('common.edit')}
                    </Link>
                    {space.is_active && (
                      <button
                        onClick={() =>
                          checkFutureReservations(space.id, space.name)
                        }
                        className="btn-ghost text-destructive hover:bg-destructive/10"
                      >
                        {t('common.deactivate')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginatedSpaces.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  {t('spaces.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.pageOf', { page: String(page), total: String(totalPages) })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-ghost border border-border"
            >
              {t('common.previous')}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-ghost border border-border"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        title={t('spaces.deactivateTitle')}
        message={
          deactivateTarget
            ? deactivateTarget.futureReservations > 0
              ? t('spaces.deactivateWithReservations', { name: deactivateTarget.name, count: String(deactivateTarget.futureReservations) })
              : t('spaces.deactivateConfirm', { name: deactivateTarget.name })
            : ''
        }
        confirmLabel={t('common.deactivate')}
        variant="destructive"
        onConfirm={() => {
          if (deactivateTarget) handleDeactivate(deactivateTarget.id)
        }}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  )
}
