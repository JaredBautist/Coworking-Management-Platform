import { useState, useMemo } from 'react'
import { useTeamMembers, useUpdateMemberRole } from './hooks'
import { useAuthStore } from '@/stores/authStore'
import { useRole } from '@/hooks/useRole'
import { useDebounce } from '@/hooks/useDebounce'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'
import { Search, Users } from 'lucide-react'
import { SkeletonTable } from '@/components/shared/SkeletonTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  PageHeader,
  Input,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Badge,
  Select,
  EmptyState,
  DataTablePagination,
} from '@/components/ui'

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
      <PageHeader
        title={t('nav.team')}
        subtitle={t('team.total', { count: String(members?.length ?? 0) })}
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('team.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-9 sm:w-72"
            />
          </div>
        }
      />

      {paginated.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('team.empty')}
          description={t('team.emptyHint')}
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t('common.name')}</TH>
              <TH>{t('team.email')}</TH>
              <TH>{t('team.role')}</TH>
            </TR>
          </THead>
          <TBody>
            {paginated.map((member) => (
              <TR key={member.id} hoverable>
                <TD className="font-medium">
                  {member.full_name}
                  {member.id === currentProfile?.id && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t('common.you')}
                    </span>
                  )}
                </TD>
                <TD className="text-muted-foreground">{member.email}</TD>
                <TD>
                  {isOfficeManager && member.id !== currentProfile?.id ? (
                    <Select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(
                          member.id,
                          e.target.value as 'office_manager' | 'member'
                        )
                      }
                      className="h-8 w-40 py-1 text-xs"
                    >
                      <option value="member">{t('team.member')}</option>
                      <option value="office_manager">{t('team.admin')}</option>
                    </Select>
                  ) : (
                    <Badge tone={member.role === 'office_manager' ? 'accent' : 'neutral'}>
                      {member.role === 'office_manager'
                        ? t('team.administrator')
                        : t('team.member')}
                    </Badge>
                  )}
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
