import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Dropdown,
  Input,
  Popconfirm,
  Spin,
  Tooltip,
  Typography,
  message,
} from 'antd'
import type { MenuProps } from 'antd'
import {
  AppstoreOutlined,
  BankOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CopyOutlined,
  EllipsisOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { cabinetsApi } from '../../api/cabinets'
import { ACCESS_STATUS_QUERY_KEY } from '../../api/user'
import NoCabinetsPlaceholder from '../../components/NoCabinetsPlaceholder'
import { formatCabinetAccessSections } from '../../constants/cabinetAccessSections'
import type { GrantedCabinetRowDto, OwnedCabinetRowDto, PendingCabinetInvitationRowDto } from '../../types/api'
import { invitationsApi } from '../../api/invitations'
import { getRequestFailureDescription } from '../../utils/requestError'

dayjs.locale('ru')

const { Text, Title } = Typography

const border = '#E2E8F0'
const accent = '#7C3AED'

function formatDateShort(value: string | null | undefined): string {
  if (!value) return '—'
  return dayjs(value).format('DD.MM.YYYY')
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return dayjs(value).format('DD.MM.YYYY HH:mm')
}

function formatAccessUntil(value: string | null | undefined): string {
  if (!value) return 'Бессрочно'
  return formatDateShort(value)
}

async function copyToClipboard(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value)
    message.success(successMessage)
  } catch {
    message.error('Не удалось скопировать')
  }
}

function ColumnHeader({ children }: { children: ReactNode }) {
  return (
    <Text type="secondary" style={{ fontSize: 12, lineHeight: '16px' }}>
      {children}
    </Text>
  )
}

function ColumnValue({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 14, lineHeight: '20px', color: '#1E293B', fontWeight: 500 }}>
      {children}
    </div>
  )
}

function ValidationCell({ at, valid }: { at: string | null | undefined; valid: boolean | null | undefined }) {
  return (
    <ColumnValue>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span>{formatDateTime(at)}</span>
        {valid === true && <CheckCircleFilled style={{ color: '#22C55E', fontSize: 16 }} />}
        {valid === false && <CloseCircleFilled style={{ color: '#EF4444', fontSize: 16 }} />}
      </span>
    </ColumnValue>
  )
}

function DataUpdateCell({ at }: { at: string | null | undefined }) {
  return (
    <ColumnValue>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span>{formatDateTime(at)}</span>
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#EFF6FF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ReloadOutlined style={{ color: '#3B82F6', fontSize: 12 }} />
        </span>
      </span>
    </ColumnValue>
  )
}

function ApiTokenCell({ masked }: { masked: string | null | undefined }) {
  if (!masked) {
    return <ColumnValue>—</ColumnValue>
  }

  return (
    <ColumnValue>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, maxWidth: '100%' }}>
        <Text
          code
          style={{
            fontSize: 13,
            padding: '2px 8px',
            borderRadius: 6,
            background: '#F8FAFC',
            border: `1px solid ${border}`,
            margin: 0,
          }}
        >
          {masked}
        </Text>
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined style={{ color: '#3B82F6' }} />}
          aria-label="Скопировать API-токен"
          onClick={() => void copyToClipboard(masked, 'API-токен скопирован')}
          style={{ flexShrink: 0 }}
        />
      </span>
    </ColumnValue>
  )
}

function RowActionsMenu({ items }: { items: MenuProps['items'] }) {
  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Button type="text" icon={<EllipsisOutlined style={{ fontSize: 18 }} />} aria-label="Действия" />
    </Dropdown>
  )
}

const ownedRowGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 1.6fr) minmax(100px, 0.8fr) minmax(150px, 1fr) minmax(150px, 1fr) minmax(180px, 1.1fr) 40px',
  gap: 16,
  alignItems: 'center',
}

const grantedRowGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(220px, 1.5fr) minmax(90px, 0.7fr) minmax(90px, 0.7fr) minmax(150px, 1fr) minmax(150px, 1fr) minmax(180px, 1.2fr)',
  gap: 16,
  alignItems: 'center',
}

function CabinetIdentity({
  name,
  badgeLabel,
  badgeColor,
  badgeBg,
  icon,
  iconBg,
  iconColor,
  to,
}: {
  name: string
  badgeLabel: string
  badgeColor: string
  badgeBg: string
  icon: ReactNode
  iconBg: string
  iconColor: string
  to?: string
}) {
  const nameNode = to ? (
    <Link to={to} style={{ color: '#1E293B', fontWeight: 600, fontSize: 15, lineHeight: '20px' }}>
      {name}
    </Link>
  ) : (
    <span style={{ color: '#1E293B', fontWeight: 600, fontSize: 15, lineHeight: '20px' }}>{name}</span>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: iconBg,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 18,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ marginBottom: 6 }}>{nameNode}</div>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            color: badgeColor,
            background: badgeBg,
            lineHeight: '16px',
          }}
        >
          {badgeLabel}
        </span>
      </div>
    </div>
  )
}

function OwnedCabinetRow({ row }: { row: OwnedCabinetRowDto }) {
  const menuItems: MenuProps['items'] = [
    {
      key: 'open',
      label: <Link to={`/cabinets/${row.id}`}>Перейти в кабинет</Link>,
    },
  ]

  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: 12,
        padding: '16px 20px',
        background: '#FFFFFF',
      }}
    >
      <div style={ownedRowGrid}>
        <CabinetIdentity
          name={row.name}
          badgeLabel="Создан вами"
          badgeColor="#15803D"
          badgeBg="#DCFCE7"
          icon={<BankOutlined />}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
          to={`/cabinets/${row.id}`}
        />
        <ColumnValue>{formatDateShort(row.createdAt)}</ColumnValue>
        <ValidationCell at={row.lastValidatedAt} valid={row.apiKeyValid} />
        <DataUpdateCell at={row.lastDataUpdateAt} />
        <ApiTokenCell masked={row.apiKeyMasked} />
        <RowActionsMenu items={menuItems} />
      </div>
    </div>
  )
}

function GrantedCabinetRow({ row }: { row: GrantedCabinetRowDto }) {
  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: 12,
        padding: '16px 20px',
        background: '#FFFFFF',
      }}
    >
      <div style={grantedRowGrid}>
        <CabinetIdentity
          name={row.name}
          badgeLabel="Доступ предоставлен"
          badgeColor={accent}
          badgeBg="#EDE9FE"
          icon={<UserOutlined />}
          iconBg="#EDE9FE"
          iconColor={accent}
        />
        <ColumnValue>{formatDateShort(row.accessFrom)}</ColumnValue>
        <ColumnValue>{formatAccessUntil(row.accessUntil)}</ColumnValue>
        <ValidationCell at={row.lastValidatedAt} valid={row.apiKeyValid} />
        <DataUpdateCell at={row.lastDataUpdateAt} />
        <ColumnValue>{formatCabinetAccessSections(row.sections)}</ColumnValue>
      </div>
    </div>
  )
}

const pendingInviteGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 1.5fr) minmax(160px, 1fr) minmax(180px, 1.2fr) minmax(140px, 0.9fr) 220px',
  gap: 16,
  alignItems: 'center',
}

function PendingInvitationRow({
  row,
  accepting,
  declining,
  onAccept,
  onDecline,
}: {
  row: PendingCabinetInvitationRowDto
  accepting: boolean
  declining: boolean
  onAccept: () => void
  onDecline: () => void
}) {
  const inviter = row.inviterName || row.inviterEmail || '—'
  const busy = accepting || declining
  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: 12,
        padding: '16px 20px',
        background: '#FFFBEB',
      }}
    >
      <div style={pendingInviteGrid}>
        <CabinetIdentity
          name={row.cabinetName}
          badgeLabel="Ожидает принятия"
          badgeColor="#B45309"
          badgeBg="#FEF3C7"
          icon={<UserOutlined />}
          iconBg="#FEF3C7"
          iconColor="#B45309"
        />
        <ColumnValue>{inviter}</ColumnValue>
        <ColumnValue>{formatCabinetAccessSections(row.sections)}</ColumnValue>
        <ColumnValue>{formatAccessUntil(row.accessUntil)}</ColumnValue>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Popconfirm
            title="Отклонить приглашение?"
            description="Доступ к кабинету не будет предоставлен."
            okText="Отклонить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
            onConfirm={onDecline}
            disabled={busy}
          >
            <Button danger disabled={busy} loading={declining}>
              Отклонить
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            loading={accepting}
            disabled={busy && !accepting}
            onClick={onAccept}
            style={{ backgroundColor: accent, borderColor: accent }}
          >
            Принять
          </Button>
        </div>
      </div>
    </div>
  )
}

function SectionCountBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 22,
        height: 22,
        padding: '0 6px',
        borderRadius: 999,
        background: '#F1F5F9',
        color: '#475569',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {count}
    </span>
  )
}

interface CabinetsCardProps {
  addCabinetOpen?: boolean
  onAddCabinetOpenChange?: (open: boolean) => void
}

export default function CabinetsCard({ addCabinetOpen, onAddCabinetOpenChange }: CabinetsCardProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [acceptingToken, setAcceptingToken] = useState<string | null>(null)
  const [decliningToken, setDecliningToken] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['cabinetsOverview', search],
    queryFn: () => cabinetsApi.getOverview(search),
  })

  const acceptMutation = useMutation({
    mutationFn: (token: string) => invitationsApi.accept(token),
    onMutate: (token) => setAcceptingToken(token),
    onSuccess: () => {
      message.success('Приглашение принято')
      void queryClient.invalidateQueries({ queryKey: ['cabinetsOverview'] })
      void queryClient.invalidateQueries({ queryKey: ACCESS_STATUS_QUERY_KEY })
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
    onSettled: () => setAcceptingToken(null),
  })

  const declineMutation = useMutation({
    mutationFn: (token: string) => invitationsApi.decline(token),
    onMutate: (token) => setDecliningToken(token),
    onSuccess: () => {
      message.success('Приглашение отклонено')
      void queryClient.invalidateQueries({ queryKey: ['cabinetsOverview'] })
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
    onSettled: () => setDecliningToken(null),
  })

  const owned = data?.owned ?? []
  const granted = data?.granted ?? []
  const pendingInvitations = data?.pendingInvitations ?? []

  return (
    <Card
      styles={{ body: { padding: 24 } }}
      style={{
        borderRadius: 16,
        border: `1px solid ${border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AppstoreOutlined style={{ fontSize: 18, color: '#1E293B' }} />
          <Title level={4} style={{ margin: 0 }}>
            Управление кабинетами
          </Title>
          <Tooltip title="Здесь отображаются ваши кабинеты Wildberries, доступы к чужим кабинетам и ожидающие приглашения.">
            <QuestionCircleOutlined style={{ color: '#94A3B8', fontSize: 14, cursor: 'help' }} />
          </Tooltip>
        </div>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
          placeholder="Поиск по кабинетам"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onClear={() => setSearchInput('')}
          style={{ width: 280, maxWidth: '100%' }}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <NoCabinetsPlaceholder
          variant="button"
          withModal={false}
          addModalOpen={addCabinetOpen}
          onAddModalOpenChange={onAddCabinetOpenChange}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>
                Созданные вами
              </Title>
              <SectionCountBadge count={owned.length} />
            </div>

            {owned.length === 0 ? (
              <NoCabinetsPlaceholder
                withModal={false}
                addModalOpen={addCabinetOpen}
                onAddModalOpenChange={onAddCabinetOpenChange}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ ...ownedRowGrid, padding: '0 20px' }}>
                  <ColumnHeader>Кабинет</ColumnHeader>
                  <ColumnHeader>Создан</ColumnHeader>
                  <ColumnHeader>Последняя проверка</ColumnHeader>
                  <ColumnHeader>Обновление данных</ColumnHeader>
                  <ColumnHeader>API-токен</ColumnHeader>
                  <span />
                </div>
                {owned.map((row) => (
                  <OwnedCabinetRow key={row.id} row={row} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>
                Доступ предоставлен
              </Title>
              <SectionCountBadge count={granted.length + pendingInvitations.length} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {pendingInvitations.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 14 }}>
                      Приглашения
                    </Text>
                    <SectionCountBadge count={pendingInvitations.length} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ ...pendingInviteGrid, padding: '0 20px' }}>
                      <ColumnHeader>Кабинет</ColumnHeader>
                      <ColumnHeader>Кто пригласил</ColumnHeader>
                      <ColumnHeader>Разделы</ColumnHeader>
                      <ColumnHeader>Доступ до</ColumnHeader>
                      <span />
                    </div>
                    {pendingInvitations.map((row) => (
                      <PendingInvitationRow
                        key={row.token}
                        row={row}
                        accepting={acceptingToken === row.token}
                        declining={decliningToken === row.token}
                        onAccept={() => acceptMutation.mutate(row.token)}
                        onDecline={() => declineMutation.mutate(row.token)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {granted.length === 0 && pendingInvitations.length === 0 ? (
                <Text type="secondary">Вам ещё не предоставили доступ к чужим кабинетам.</Text>
              ) : granted.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ ...grantedRowGrid, padding: '0 20px' }}>
                    <ColumnHeader>Кабинет</ColumnHeader>
                    <ColumnHeader>Доступ с</ColumnHeader>
                    <ColumnHeader>Доступ до</ColumnHeader>
                    <ColumnHeader>Последняя проверка</ColumnHeader>
                    <ColumnHeader>Обновление данных</ColumnHeader>
                    <ColumnHeader>Разделы</ColumnHeader>
                  </div>
                  {granted.map((row) => (
                    <GrantedCabinetRow key={row.id} row={row} />
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}

      {isFetching && !isLoading && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Spin size="small" />
        </div>
      )}

      <NoCabinetsPlaceholder
        variant="modal-only"
        addModalOpen={addCabinetOpen}
        onAddModalOpenChange={onAddCabinetOpenChange}
      />
    </Card>
  )
}
