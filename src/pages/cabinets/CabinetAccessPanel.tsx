import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Popover,
  Select,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import { PlusOutlined, SendOutlined, StopOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import { cabinetsApi } from '../../api/cabinets'
import {
  CABINET_ACCESS_SECTION_OPTIONS,
} from '../../constants/cabinetAccessSections'
import type { CabinetAccessEntryDto, CabinetAccessSection, GrantCabinetAccessRequest } from '../../types/api'
import { GRANT_ACCOUNT_TYPE_OPTIONS } from '../../constants/grantAccountTypes'
import { getRequestFailureDescription } from '../../utils/requestError'

dayjs.locale('ru')

const { Text } = Typography

type AccessTab = 'all' | 'active' | 'invitations' | 'revoked'

interface GrantFormValues {
  email: string
  accountType: GrantCabinetAccessRequest['accountType']
  comment?: string
  sections: CabinetAccessSection[]
  validUntil?: Dayjs | null
}

interface CabinetAccessPanelProps {
  cabinetId: number
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return dayjs(value).format('DD.MM.YYYY HH:mm')
}

function formatAccessUntil(value: string | null | undefined): string {
  if (!value) return 'Бессрочно'
  return dayjs(value).format('DD.MM.YYYY HH:mm')
}

function canEditAccessUntil(row: CabinetAccessEntryDto): boolean {
  if (row.kind === 'INVITATION') {
    return row.invitationStatus === 'PENDING'
  }
  return row.kind === 'GRANT' && row.statusLabel === 'Активен'
}

function canEditSections(row: CabinetAccessEntryDto): boolean {
  return canEditAccessUntil(row)
}

function sameSections(a: CabinetAccessSection[] | undefined, b: CabinetAccessSection[]): boolean {
  const left = [...(a ?? [])].sort()
  const right = [...b].sort()
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

function toValidUntilPayload(value: Dayjs | null | undefined): string | null {
  return value ? value.endOf('day').format('YYYY-MM-DDTHH:mm:ss') : null
}

function isSameValidUntil(current: string | null | undefined, next: string | null): boolean {
  return toValidUntilPayload(current ? dayjs(current) : null) === next
}

function isRevokedEntry(row: CabinetAccessEntryDto): boolean {
  if (row.kind === 'GRANT') {
    return row.statusLabel === 'Доступ отозван'
  }
  return (
    row.invitationStatus === 'REVOKED' ||
    row.invitationStatus === 'DECLINED' ||
    row.invitationStatus === 'EXPIRED'
  )
}

function canResendInvitation(row: CabinetAccessEntryDto): boolean {
  return (
    row.kind === 'INVITATION' &&
    (row.invitationStatus === 'REVOKED' ||
      row.invitationStatus === 'DECLINED' ||
      row.invitationStatus === 'EXPIRED')
  )
}

function canReinviteFromGrant(row: CabinetAccessEntryDto): boolean {
  return row.kind === 'GRANT' && row.statusLabel === 'Доступ отозван'
}

function filterByTab(entries: CabinetAccessEntryDto[], tab: AccessTab): CabinetAccessEntryDto[] {
  switch (tab) {
    case 'active':
      return entries.filter((e) => e.kind === 'GRANT' && e.statusLabel === 'Активен')
    case 'invitations':
      return entries.filter((e) => e.kind === 'INVITATION' && e.invitationStatus === 'PENDING')
    case 'revoked':
      return entries.filter(isRevokedEntry)
    default:
      return entries
  }
}

function statusTagColor(row: CabinetAccessEntryDto): string {
  if (row.kind === 'INVITATION') {
    if (row.invitationStatus === 'PENDING') return 'processing'
    if (row.invitationStatus === 'DECLINED') return 'warning'
    if (row.invitationStatus === 'EXPIRED') return 'warning'
    return 'default'
  }
  return row.statusLabel === 'Активен' ? 'success' : 'default'
}

interface AccessUntilCellProps {
  row: CabinetAccessEntryDto
  loading: boolean
  onChange: (row: CabinetAccessEntryDto, value: Dayjs | null) => void
}

function AccessUntilCell({ row, loading, onChange }: AccessUntilCellProps) {
  if (!canEditAccessUntil(row)) {
    return <span>{formatAccessUntil(row.accessUntil)}</span>
  }

  return (
    <DatePicker
      size="small"
      className="cabinet-access-until-picker"
      format="DD.MM.YYYY"
      placeholder="Бессрочно"
      allowClear
      value={row.accessUntil ? dayjs(row.accessUntil) : null}
      disabled={loading}
      disabledDate={(current) => current != null && current < dayjs().startOf('day')}
      onChange={(value) => onChange(row, value)}
    />
  )
}

interface SectionsCellProps {
  row: CabinetAccessEntryDto
  loading: boolean
  onChange: (row: CabinetAccessEntryDto, sections: CabinetAccessSection[]) => void
}

function SectionsList({ selected }: { selected: CabinetAccessSection[] }) {
  const selectedSet = new Set(selected)
  return (
    <div className="cabinet-access-sections-list">
      {CABINET_ACCESS_SECTION_OPTIONS.map((option) => {
        const enabled = selectedSet.has(option.value)
        return (
          <span
            key={option.value}
            className={enabled ? 'is-enabled' : undefined}
          >
            {option.label}
          </span>
        )
      })}
    </div>
  )
}

function SectionsCell({ row, loading, onChange }: SectionsCellProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<CabinetAccessSection[]>(row.sections ?? [])
  const sections = row.sections ?? []

  const openEditor = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraft(sections)
    }
    setOpen(nextOpen)
  }

  const applyDraft = () => {
    if (!draft.length) {
      message.warning('Нужно выбрать хотя бы один раздел')
      return
    }
    if (!sameSections(sections, draft)) {
      onChange(row, draft)
    }
    setOpen(false)
  }

  if (!canEditSections(row)) {
    return <SectionsList selected={sections} />
  }

  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={openEditor}
      placement="bottomLeft"
      content={
        <div style={{ width: 220, maxWidth: 'calc(100vw - 48px)' }}>
          <Checkbox.Group
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            options={CABINET_ACCESS_SECTION_OPTIONS}
            value={draft}
            onChange={(value) => setDraft(value as CabinetAccessSection[])}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button size="small" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button
              type="primary"
              size="small"
              loading={loading}
              onClick={applyDraft}
              style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
            >
              Сохранить
            </Button>
          </div>
        </div>
      }
    >
      <button
        type="button"
        disabled={loading}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          margin: 0,
          cursor: loading ? 'wait' : 'pointer',
          textAlign: 'left',
          opacity: loading ? 0.6 : 1,
        }}
        title="Изменить разделы"
      >
        <SectionsList selected={sections} />
      </button>
    </Popover>
  )
}

interface AccessActionsProps {
  row: CabinetAccessEntryDto
  block?: boolean
  revokeGrantPending: boolean
  revokeInvitationPending: boolean
  resendInvitationPending: boolean
  reinviteFromGrantPending: boolean
  onRevokeGrant: (id: number) => void
  onRevokeInvitation: (id: number) => void
  onResendInvitation: (id: number) => void
  onReinviteFromGrant: (id: number) => void
}

/** Кнопки отзыва и повторной отправки приглашения. */
function AccessActions({
  row,
  block = false,
  revokeGrantPending,
  revokeInvitationPending,
  resendInvitationPending,
  reinviteFromGrantPending,
  onRevokeGrant,
  onRevokeInvitation,
  onResendInvitation,
  onReinviteFromGrant,
}: AccessActionsProps) {
  const buttonProps = block
    ? { type: 'default' as const, size: 'middle' as const, block: true }
    : { type: 'link' as const, size: 'small' as const }

  if (row.kind === 'GRANT' && row.statusLabel === 'Активен') {
    return (
      <Popconfirm
        title="Отозвать доступ?"
        description="Пользователь потеряет доступ к кабинету."
        okText="Отозвать"
        cancelText="Отмена"
        onConfirm={() => onRevokeGrant(row.id)}
      >
        <Button {...buttonProps} danger icon={<StopOutlined />} loading={revokeGrantPending}>
          Отозвать
        </Button>
      </Popconfirm>
    )
  }
  if (row.kind === 'INVITATION' && row.invitationStatus === 'PENDING') {
    return (
      <Popconfirm
        title="Отозвать приглашение?"
        okText="Отозвать"
        cancelText="Отмена"
        onConfirm={() => onRevokeInvitation(row.id)}
      >
        <Button {...buttonProps} danger icon={<StopOutlined />} loading={revokeInvitationPending}>
          Отозвать
        </Button>
      </Popconfirm>
    )
  }
  if (canResendInvitation(row)) {
    return (
      <Popconfirm
        title="Отправить приглашение снова?"
        description="На этот email уйдёт новое письмо со ссылкой."
        okText="Отправить"
        cancelText="Отмена"
        onConfirm={() => onResendInvitation(row.id)}
      >
        <Button {...buttonProps} icon={<SendOutlined />} loading={resendInvitationPending}>
          Отправить снова
        </Button>
      </Popconfirm>
    )
  }
  if (canReinviteFromGrant(row)) {
    return (
      <Popconfirm
        title="Отправить приглашение снова?"
        description="На этот email уйдёт новое письмо со ссылкой."
        okText="Отправить"
        cancelText="Отмена"
        onConfirm={() => onReinviteFromGrant(row.id)}
      >
        <Button {...buttonProps} icon={<SendOutlined />} loading={reinviteFromGrantPending}>
          Отправить снова
        </Button>
      </Popconfirm>
    )
  }
  return null
}

interface AccessEntryCardProps {
  row: CabinetAccessEntryDto
  updatingUntil: boolean
  updatingSections: boolean
  onAccessUntilChange: (row: CabinetAccessEntryDto, value: Dayjs | null) => void
  onSectionsChange: (row: CabinetAccessEntryDto, sections: CabinetAccessSection[]) => void
  actions: Omit<AccessActionsProps, 'row' | 'block'>
}

/** Карточка доступа для узкого экрана вместо строки таблицы. */
function AccessEntryCard({
  row,
  updatingUntil,
  updatingSections,
  onAccessUntilChange,
  onSectionsChange,
  actions,
}: AccessEntryCardProps) {
  const hasDistinctName = Boolean(row.userName?.trim()) && row.userName !== row.userEmail
  const actionButton = <AccessActions row={row} block {...actions} />

  return (
    <div className="cabinet-access-card">
      <div className="cabinet-access-card-head">
        <div className="cabinet-access-card-user">
          <Text strong>{row.userName?.trim() || row.userEmail}</Text>
          {hasDistinctName && (
            <Text type="secondary" className="cabinet-access-card-email">
              {row.userEmail}
            </Text>
          )}
        </div>
        <Tag color={statusTagColor(row)}>{row.statusLabel}</Tag>
      </div>

      <div className="cabinet-access-card-sections">
        <span className="cabinet-access-card-label">Разделы</span>
        <SectionsCell row={row} loading={updatingSections} onChange={onSectionsChange} />
      </div>

      <div className="cabinet-access-card-dates">
        <div className="cabinet-access-card-date">
          <span className="cabinet-access-card-label">С</span>
          <span className="cabinet-access-card-value">{formatDate(row.accessFrom)}</span>
        </div>
        <div className="cabinet-access-card-date">
          <span className="cabinet-access-card-label">До</span>
          <div className="cabinet-access-card-value">
            <AccessUntilCell row={row} loading={updatingUntil} onChange={onAccessUntilChange} />
          </div>
        </div>
      </div>

      {actionButton ? <div className="cabinet-access-card-actions">{actionButton}</div> : null}
    </div>
  )
}

export default function CabinetAccessPanel({ cabinetId }: CabinetAccessPanelProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<AccessTab>('all')
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [updatingUntilKey, setUpdatingUntilKey] = useState<string | null>(null)
  const [updatingSectionsKey, setUpdatingSectionsKey] = useState<string | null>(null)
  const [form] = Form.useForm<GrantFormValues>()
  const selectedSections = Form.useWatch('sections', form) ?? []

  const { data: entries = [], isLoading, isFetching } = useQuery({
    queryKey: ['cabinetAccess', cabinetId],
    queryFn: () => cabinetsApi.listAccess(cabinetId),
  })

  const invalidateAccess = () => {
    void queryClient.invalidateQueries({ queryKey: ['cabinetAccess', cabinetId] })
    void queryClient.invalidateQueries({ queryKey: ['cabinetsOverview'] })
  }

  const grantMutation = useMutation({
    mutationFn: (body: GrantCabinetAccessRequest) => cabinetsApi.grantAccess(cabinetId, body),
    onSuccess: (data) => {
      message.success(data.message || 'Приглашение отправлено')
      setGrantModalOpen(false)
      form.resetFields()
      invalidateAccess()
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
  })

  const revokeGrantMutation = useMutation({
    mutationFn: (grantId: number) => cabinetsApi.revokeGrant(cabinetId, grantId),
    onSuccess: (data) => {
      message.success(data.message || 'Доступ отозван')
      invalidateAccess()
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
  })

  const revokeInvitationMutation = useMutation({
    mutationFn: (invitationId: number) => cabinetsApi.revokeInvitation(cabinetId, invitationId),
    onSuccess: (data) => {
      message.success(data.message || 'Приглашение отозвано')
      invalidateAccess()
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
  })

  const resendInvitationMutation = useMutation({
    mutationFn: (invitationId: number) => cabinetsApi.resendInvitation(cabinetId, invitationId),
    onSuccess: (data) => {
      message.success(data.message || 'Приглашение отправлено повторно')
      invalidateAccess()
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
  })

  const reinviteFromGrantMutation = useMutation({
    mutationFn: (grantId: number) => cabinetsApi.reinviteFromGrant(cabinetId, grantId),
    onSuccess: (data) => {
      message.success(data.message || 'Приглашение отправлено повторно')
      invalidateAccess()
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
  })

  const updateValidUntilMutation = useMutation({
    mutationFn: ({ entry, validUntil }: { entry: CabinetAccessEntryDto; validUntil: string | null }) => {
      const body = { validUntil }
      if (entry.kind === 'INVITATION') {
        return cabinetsApi.updateInvitationValidUntil(cabinetId, entry.id, body)
      }
      return cabinetsApi.updateGrantValidUntil(cabinetId, entry.id, body)
    },
    onMutate: ({ entry }) => {
      setUpdatingUntilKey(`${entry.kind}-${entry.id}`)
    },
    onSuccess: (data) => {
      message.success(data.message || 'Срок доступа обновлён')
      invalidateAccess()
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
    onSettled: () => {
      setUpdatingUntilKey(null)
    },
  })

  const updateSectionsMutation = useMutation({
    mutationFn: ({ entry, sections }: { entry: CabinetAccessEntryDto; sections: CabinetAccessSection[] }) => {
      const body = { sections }
      if (entry.kind === 'INVITATION') {
        return cabinetsApi.updateInvitationSections(cabinetId, entry.id, body)
      }
      return cabinetsApi.updateGrantSections(cabinetId, entry.id, body)
    },
    onMutate: ({ entry }) => {
      setUpdatingSectionsKey(`${entry.kind}-${entry.id}`)
    },
    onSuccess: (data) => {
      message.success(data.message || 'Разделы обновлены')
      invalidateAccess()
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
    onSettled: () => {
      setUpdatingSectionsKey(null)
    },
  })

  const handleAccessUntilChange = useCallback((row: CabinetAccessEntryDto, value: Dayjs | null) => {
    const validUntil = toValidUntilPayload(value)
    if (isSameValidUntil(row.accessUntil, validUntil)) return
    updateValidUntilMutation.mutate({ entry: row, validUntil })
  }, [updateValidUntilMutation])

  const handleSectionsChange = useCallback((row: CabinetAccessEntryDto, sections: CabinetAccessSection[]) => {
    updateSectionsMutation.mutate({ entry: row, sections })
  }, [updateSectionsMutation])

  const filteredEntries = useMemo(() => filterByTab(entries, activeTab), [entries, activeTab])

  const accessActionHandlers = useMemo(
    () => ({
      revokeGrantPending: revokeGrantMutation.isPending,
      revokeInvitationPending: revokeInvitationMutation.isPending,
      resendInvitationPending: resendInvitationMutation.isPending,
      reinviteFromGrantPending: reinviteFromGrantMutation.isPending,
      onRevokeGrant: (id: number) => revokeGrantMutation.mutate(id),
      onRevokeInvitation: (id: number) => revokeInvitationMutation.mutate(id),
      onResendInvitation: (id: number) => resendInvitationMutation.mutate(id),
      onReinviteFromGrant: (id: number) => reinviteFromGrantMutation.mutate(id),
    }),
    [revokeGrantMutation, revokeInvitationMutation, resendInvitationMutation, reinviteFromGrantMutation],
  )

  const tabCounts = useMemo(
    () => ({
      all: entries.length,
      active: filterByTab(entries, 'active').length,
      invitations: filterByTab(entries, 'invitations').length,
      revoked: filterByTab(entries, 'revoked').length,
    }),
    [entries],
  )

  const columns = useMemo(
    () => [
      {
        title: 'Пользователь',
        key: 'user',
        render: (_: unknown, row: CabinetAccessEntryDto) => {
          const hasDistinctName = Boolean(row.userName?.trim()) && row.userName !== row.userEmail
          return (
            <div>
              <Text strong>{row.userName?.trim() || row.userEmail}</Text>
              {hasDistinctName && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {row.userEmail}
                  </Text>
                </div>
              )}
            </div>
          )
        },
      },
      {
        title: 'Разделы',
        dataIndex: 'sections',
        key: 'sections',
        render: (_: CabinetAccessSection[], row: CabinetAccessEntryDto) => (
          <SectionsCell
            row={row}
            loading={updatingSectionsKey === `${row.kind}-${row.id}`}
            onChange={handleSectionsChange}
          />
        ),
      },
      {
        title: 'С',
        dataIndex: 'accessFrom',
        key: 'accessFrom',
        render: (v: string) => formatDate(v),
      },
      {
        title: 'До',
        dataIndex: 'accessUntil',
        key: 'accessUntil',
        render: (_: string | null, row: CabinetAccessEntryDto) => (
          <AccessUntilCell
            row={row}
            loading={updatingUntilKey === `${row.kind}-${row.id}`}
            onChange={handleAccessUntilChange}
          />
        ),
      },
      {
        title: 'Статус',
        dataIndex: 'statusLabel',
        key: 'statusLabel',
        render: (label: string, row: CabinetAccessEntryDto) => (
          <Tag color={statusTagColor(row)}>
            {label}
          </Tag>
        ),
      },
      {
        title: 'Действия',
        key: 'actions',
        render: (_: unknown, row: CabinetAccessEntryDto) => (
          <AccessActions row={row} {...accessActionHandlers} />
        ),
      },
    ],
    [accessActionHandlers, updatingUntilKey, updatingSectionsKey, handleAccessUntilChange, handleSectionsChange],
  )

  const tabItems = [
    { key: 'all', label: `Все (${tabCounts.all})` },
    { key: 'active', label: `Активные (${tabCounts.active})` },
    { key: 'invitations', label: `Приглашения (${tabCounts.invitations})` },
    { key: 'revoked', label: `Отозванные (${tabCounts.revoked})` },
  ]

  return (
    <div className="cabinet-access-panel">
      <style>{`
        .cabinet-access-until-picker {
          min-width: 132px;
        }
        .cabinet-access-sections-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
          line-height: 1.25;
        }
        .cabinet-access-sections-list span {
          font-size: 11px;
          color: #94A3B8;
          font-weight: 400;
        }
        .cabinet-access-sections-list span.is-enabled {
          color: #15803D;
          font-weight: 500;
        }
        .cabinet-access-cards {
          display: none;
        }
        @media (max-width: 900px) {
          .cabinet-access-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .cabinet-access-toolbar .ant-btn {
            width: 100%;
          }
          .cabinet-access-tabs {
            margin-bottom: 12px !important;
          }
          .cabinet-access-tabs .ant-tabs-nav {
            margin-bottom: 12px;
          }
          .cabinet-access-tabs .ant-tabs-nav-wrap {
            overflow: visible;
          }
          .cabinet-access-tabs .ant-tabs-nav-list {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            width: 100% !important;
            transform: none !important;
          }
          .cabinet-access-tabs .ant-tabs-nav-operations {
            display: none !important;
          }
          .cabinet-access-tabs .ant-tabs-ink-bar {
            display: none;
          }
          .cabinet-access-tabs .ant-tabs-tab,
          .cabinet-access-tabs .ant-tabs-tab + .ant-tabs-tab {
            margin: 0 !important;
            padding: 8px 6px;
            font-size: 13px;
            justify-content: center;
            text-align: center;
            border-bottom: 2px solid transparent;
          }
          .cabinet-access-tabs .ant-tabs-tab-active {
            border-bottom-color: #7C3AED;
          }
          .cabinet-access-table {
            display: none;
          }
          .cabinet-access-cards {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .cabinet-access-card {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 14px;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            background: #fff;
          }
          .cabinet-access-card-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            padding-bottom: 10px;
            margin-bottom: 2px;
            border-bottom: 1px solid #F1F5F9;
          }
          .cabinet-access-card-user {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
          }
          .cabinet-access-card-email {
            font-size: 12px;
            word-break: break-all;
          }
          .cabinet-access-card-head .ant-tag {
            margin-inline-end: 0;
            margin-top: 2px;
            flex-shrink: 0;
          }
          .cabinet-access-card-sections {
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            gap: 8px;
          }
          .cabinet-access-card-sections .cabinet-access-card-label {
            line-height: 1.3;
            padding-top: 0;
          }
          .cabinet-access-card-sections > button,
          .cabinet-access-card-sections > .cabinet-access-sections-list {
            display: flex;
            flex: 1;
            min-width: 0;
            width: auto;
            text-align: left;
            align-items: flex-start;
          }
          .cabinet-access-card .cabinet-access-sections-list {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: flex-start;
            align-items: baseline;
            gap: 2px 10px;
            width: 100%;
          }
          .cabinet-access-card .cabinet-access-sections-list span {
            font-size: 11px;
            line-height: 1.3;
            white-space: nowrap;
          }
          .cabinet-access-card-dates {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 8px 12px;
            align-items: center;
          }
          .cabinet-access-card-date {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }
          .cabinet-access-card-label {
            font-size: 12px;
            line-height: 16px;
            color: #64748B;
            flex-shrink: 0;
          }
          .cabinet-access-card-value {
            min-width: 0;
            font-size: 13px;
            line-height: 20px;
            color: #1E293B;
          }
          .cabinet-access-card-actions .ant-btn {
            width: 100%;
          }
          .cabinet-access-until-picker {
            min-width: 0;
            width: 100%;
          }
          .cabinet-access-until-picker.ant-picker {
            width: 100%;
          }
        }
      `}</style>
      <div className="cabinet-access-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Text strong style={{ fontSize: 16 }}>
          Доступы к кабинету
        </Text>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setGrantModalOpen(true)}
          style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
        >
          Выдать доступ
        </Button>
      </div>

      <Tabs
        className="cabinet-access-tabs"
        size="small"
        tabBarGutter={0}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as AccessTab)}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      <div className="cabinet-access-table">
        <Table
          rowKey={(row) => `${row.kind}-${row.id}`}
          columns={columns}
          dataSource={filteredEntries}
          loading={isLoading || isFetching}
          pagination={false}
          locale={{ emptyText: 'Нет записей' }}
          size="middle"
        />
      </div>

      <div className="cabinet-access-cards">
        <Spin spinning={isLoading || isFetching}>
          {filteredEntries.length === 0 && !isLoading ? (
            <Text type="secondary">Нет записей</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredEntries.map((row) => (
                <AccessEntryCard
                  key={`${row.kind}-${row.id}`}
                  row={row}
                  updatingUntil={updatingUntilKey === `${row.kind}-${row.id}`}
                  updatingSections={updatingSectionsKey === `${row.kind}-${row.id}`}
                  onAccessUntilChange={handleAccessUntilChange}
                  onSectionsChange={handleSectionsChange}
                  actions={accessActionHandlers}
                />
              ))}
            </div>
          )}
        </Spin>
      </div>

      <Modal
        className="profile-modal"
        title="Выдать доступ"
        open={grantModalOpen}
        destroyOnClose
        onCancel={() => {
          setGrantModalOpen(false)
          form.resetFields()
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setGrantModalOpen(false)
              form.resetFields()
            }}
          >
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={grantMutation.isPending}
            style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
            onClick={() => form.submit()}
          >
            Выдать
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            const body: GrantCabinetAccessRequest = {
              email: values.email.trim(),
              accountType: values.accountType,
              comment: values.comment?.trim() || undefined,
              sections: values.sections,
              validUntil: values.validUntil ? values.validUntil.endOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined,
            }
            grantMutation.mutate(body)
          }}
        >
          <Form.Item
            name="email"
            label="Email пользователя"
            rules={[
              { required: true, whitespace: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item
            name="accountType"
            label="Кем является пользователь"
            rules={[{ required: true, message: 'Укажите, кем является пользователь' }]}
          >
            <Select placeholder="Выберите роль пользователя" options={GRANT_ACCOUNT_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="comment" label="Комментарий">
            <Input.TextArea
              rows={2}
              placeholder={'Например: «Маркетолог», «Менеджер WB», «Иван из агентства».\nКомментарий виден только вам'}
            />
          </Form.Item>
          <Form.Item
            name="sections"
            label="Разделы"
            rules={[{ required: true, type: 'array', min: 1, message: 'Выберите хотя бы один раздел' }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Выберите разделы"
              options={CABINET_ACCESS_SECTION_OPTIONS}
              optionFilterProp="label"
              menuItemSelectedIcon={null}
              optionRender={(option) => {
                const value = option.value as CabinetAccessSection
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Checkbox checked={selectedSections.includes(value)} style={{ pointerEvents: 'none' }} />
                    <span>{option.label}</span>
                  </div>
                )
              }}
            />
          </Form.Item>
          <Form.Item name="validUntil" label="Доступ до">
            <DatePicker
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              placeholder="Необязательно"
              disabledDate={(current) => current != null && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
