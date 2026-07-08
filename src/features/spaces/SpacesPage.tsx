import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpaces } from './hooks'
import { SkeletonTable } from '@/components/shared/SkeletonTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/stores/uiStore'
import { Plus, Pencil, Building2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  PageHeader,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Badge,
  Button,
  EmptyState,
  DataTablePagination,
  buttonVariants,
} from '@/components/ui'

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
      <PageHeader
        title={t('nav.spaces')}
        actions={
          <Link to="/app/spaces/new" className={buttonVariants({ size: 'md' })}>
            <Plus className="h-4 w-4" />
            {t('spaces.new')}
          </Link>
        }
      />

      {paginatedSpaces.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('spaces.empty')}
          description={t('spaces.emptyHint')}
          action={
            <Link to="/app/spaces/new" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Plus className="h-4 w-4" />
              {t('spaces.new')}
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t('common.name')}</TH>
              <TH>{t('common.type')}</TH>
              <TH>{t('common.capacity')}</TH>
              <TH>{t('common.status')}</TH>
              <TH className="text-right" />
            </TR>
          </THead>
          <TBody>
            {paginatedSpaces.map((space) => (
              <TR key={space.id} hoverable>
                <TD className="font-medium">{space.name}</TD>
                <TD className="text-muted-foreground">
                  {t(`spaceType.${space.type}`)}
                </TD>
                <TD className="text-muted-foreground">{space.capacity}</TD>
                <TD>
                  <Badge tone={space.is_active ? 'success' : 'neutral'}>
                    {space.is_active ? t('common.active') : t('common.inactive')}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      to={`/app/spaces/${space.id}/edit`}
                      className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {t('common.edit')}
                    </Link>
                    {space.is_active && (
                      <Button
                        variant="destructive-ghost"
                        size="sm"
                        onClick={() =>
                          checkFutureReservations(space.id, space.name)
                        }
                      >
                        {t('common.deactivate')}
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <DataTablePagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

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
