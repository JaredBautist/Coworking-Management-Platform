import { useState, useMemo } from 'react'
import { useTeamMembers, useUpdateMemberRole } from './hooks'
import { useAuthStore } from '@/stores/authStore'
import { useRole } from '@/hooks/useRole'
import { useDebounce } from '@/hooks/useDebounce'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'
import { SkeletonTable } from '@/components/shared/SkeletonTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

const ITEMS_PER_PAGE = 25

export default function TeamPage() {
  const { t } = useI18n()
  const currentProfile = useAuthStore((s) => s.profile)
  const { isOfficeManager } = useRole()
  const { data: members, isLoading } = useTeamMembers()
  const updateRole = useUpdateMemberRole()
  const addToast = useUIStore((s) => s.addToast)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selfDemoteTarget, setSelfDemoteTarget] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const filtered = useMemo(() => {
    if (!members) return []
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  }, [members, debouncedSearch])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  const adminCount = members?.filter((m) => m.role === 'office_manager').length ?? 0

  const handleRoleChange = async (
    memberId: string,
    newRole: 'office_manager' | 'member'
  ) => {
    if (memberId === currentProfile?.id && newRole === 'member') {
      if (adminCount <= 1) {
        addToast({
          type: 'error',
          message: t('team.lastAdminError'),
        })
        return
      }
      setSelfDemoteTarget(memberId)
      return
    }

    try {
      await updateRole.mutateAsync({ memberId, newRole })
      addToast({
        type: 'success',
        message: t('team.roleUpdated'),
      })
    } catch {
      addToast({ type: 'error', message: t('team.roleUpdateError') })
    }
  }

  const handleConfirmSelfDemote = async () => {
    if (!selfDemoteTarget) return
    try {
      await updateRole.mutateAsync({
        memberId: selfDemoteTarget,
        newRole: 'member',
      })
      addToast({
        type: 'success',
        message: t('team.roleUpdated'),
      })
    } catch {
      addToast({ type: 'error', message: t('team.roleUpdateError') })
    }
    setSelfDemoteTarget(null)
  }

  if (isLoading) return <SkeletonTable rows={5} />

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('nav.team')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('team.total', { count: String(members?.length ?? 0) })}
          </p>
        </div>
        <input
          type="text"
          placeholder={t('team.searchPlaceholder')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="input-field max-w-xs"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                {t('common.name')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                {t('team.email')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                {t('team.role')}
              </th>
              {isOfficeManager && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {paginated.map((member) => (
              <tr
                key={member.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-muted/50"
              >
                <td className="px-4 py-3 text-sm font-medium text-foreground">
                  {member.full_name}
                  {member.id === currentProfile?.id && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t('common.you')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {member.email}
                </td>
                <td className="px-4 py-3">
                  {isOfficeManager && member.id !== currentProfile?.id ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(
                          member.id,
                          e.target.value as 'office_manager' | 'member'
                        )
                      }
                      className="input-field px-2 py-1"
                    >
                      <option value="member">{t('team.member')}</option>
                      <option value="office_manager">{t('team.admin')}</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        member.role === 'office_manager'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {member.role === 'office_manager'
                        ? t('team.administrator')
                        : t('team.member')}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  {t('team.empty')}
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
        open={!!selfDemoteTarget}
        title={t('team.selfDemoteTitle')}
        message={t('team.selfDemoteMessage')}
        confirmLabel={t('common.confirm')}
        variant="destructive"
        onConfirm={handleConfirmSelfDemote}
        onCancel={() => setSelfDemoteTarget(null)}
      />
    </div>
  )
}
