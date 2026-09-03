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
  CheckCircleFilled,
  CloseCircleFilled,
  CopyOutlined,
  EllipsisOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { cabinetsApi } from '../../api/cabinets'
import { ACCESS_STATUS_QUERY_KEY } from '../../api/user'
import NoCabinetsPlaceholder from '../../components/NoCabinetsPlaceholder'
import { formatCabinetAccessSections } from '../../constants/cabinetAccessSections'
import type { GrantedCabinetRowDto, OwnedCabinetRowDto, PendingCabinetInvitationRowDto, MarketplaceType } from '../../types/api'
import MarketplaceTypeTag from '../../components/MarketplaceTypeTag'
import { invitationsApi } from '../../api/invitations'
import { getRequestFailureDescription } from '../../utils/requestError'
import { ONBOARDING_TARGETS } from '../../onboarding/targets'

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
    <div style={{ fontSize: 14, lineHeight: '20px', color: '#1E293B', fontWeight: 500, minWidth: 0 }}>
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

function DataUpdateCell({
  at,
  onRefresh,
  refreshing,
  canRefresh,
  remainingLabel,
}: {
  at: string | null | undefined
  onRefresh?: () => void
  refreshing?: boolean
  canRefresh?: boolean
  remainingLabel?: string | null
}) {
  const tooltip =
    onRefresh == null
      ? undefined
      : canRefresh
        ? 'Запустить обновление данных кабинета'
        : `Не чаще одного раза в 6 часов. Следующее обновление через ${remainingLabel ?? '…'}.`

  return (
    <ColumnValue>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span>{formatDateTime(at)}</span>
        {onRefresh != null && (
          <Tooltip title={tooltip}>
            <span>
              <Button
                type="text"
                size="small"
                shape="circle"
                loading={refreshing}
                disabled={!canRefresh || refreshing}
                icon={<ReloadOutlined style={{ color: '#3B82F6', fontSize: 12 }} />}
                aria-label="Обновить данные"
                onClick={onRefresh}
                style={{
                  width: 24,
                  height: 24,
                  minWidth: 24,
                  background: '#EFF6FF',
                }}
              />
            </span>
          </Tooltip>
        )}
      </span>
    </ColumnValue>
  )
}

const SELLER_DATA_UPDATE_COOLDOWN_HOURS = 6

function lastCabinetUpdateActionAt(row: OwnedCabinetRowDto): string | null {
  const completed = row.lastDataUpdateAt
  const requested = row.lastDataUpdateRequestedAt ?? null
  if (!completed && !requested) return null
  if (!completed) return requested
  if (!requested) return completed
  return dayjs(completed).isAfter(dayjs(requested)) ? completed : requested
}

function canSellerRefreshCabinet(row: OwnedCabinetRowDto): boolean {
  const lastAt = lastCabinetUpdateActionAt(row)
  if (!lastAt) return true
  return dayjs().diff(dayjs(lastAt), 'hour') >= SELLER_DATA_UPDATE_COOLDOWN_HOURS
}

function sellerRefreshRemainingLabel(row: OwnedCabinetRowDto): string | null {
  const lastAt = lastCabinetUpdateActionAt(row)
  if (!lastAt) return null
  const remaining = SELLER_DATA_UPDATE_COOLDOWN_HOURS - dayjs().diff(dayjs(lastAt), 'hour')
  if (remaining <= 0) return null
  const word = remaining === 1 ? 'час' : remaining < 5 ? 'часа' : 'часов'
  return `${remaining} ${word}`
}

function isMaskedApiKey(value: string | null | undefined): boolean {
  return !value || value.includes('...')
}

function ApiTokenCell({ cabinetId, masked }: { cabinetId: number; masked: string | null | undefined }) {
  const [copying, setCopying] = useState(false)

  if (!masked) {
    return <ColumnValue>—</ColumnValue>
  }

  const copyFullToken = async () => {
    setCopying(true)
    try {
      const cabinet = await cabinetsApi.getById(cabinetId)
      const token = cabinet.apiKey?.apiKey?.trim() ?? ''
      if (isMaskedApiKey(token)) {
        message.error('Не удалось получить полный токен')
        return
      }
      await copyToClipboard(token, 'API-токен скопирован')
    } catch {
      message.error('Не удалось скопировать')
    } finally {
      setCopying(false)
    }
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
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {masked}
        </Text>
        <Button
          type="text"
          size="small"
          loading={copying}
          icon={<CopyOutlined style={{ color: '#3B82F6' }} />}
          aria-label="Скопировать API-токен"
          onClick={() => void copyFullToken()}
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

const ROW_H_PAD = 20

const OWNED_COLUMNS = 'minmax(0, 2.4fr) 108px 168px 176px minmax(160px, 1fr) 40px'
const GRANTED_COLUMNS = 'minmax(0, 2.2fr) 108px 108px 168px 176px minmax(140px, 1fr)'
const PENDING_COLUMNS = 'minmax(0, 2fr) minmax(140px, 1fr) minmax(140px, 1fr) 108px 220px'

function tableGrid(columns: string): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: columns,
    columnGap: 20,
    rowGap: 12,
  }
}

function subgridHeader(): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    gridColumn: '1 / -1',
    alignItems: 'center',
    boxSizing: 'border-box',
    padding: `0 ${ROW_H_PAD}px`,
    border: '1px solid transparent',
  }
}

function subgridCard(background = '#FFFFFF'): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    gridColumn: '1 / -1',
    alignItems: 'center',
    boxSizing: 'border-box',
    padding: `16px ${ROW_H_PAD}px`,
    border: `1px solid ${border}`,
    borderRadius: 12,
    background,
  }
}

function CabinetIdentity({
  name,
  marketplaceType,
  badgeLabel,
  badgeColor,
  badgeBg,
  to,
}: {
  name: string
  marketplaceType?: MarketplaceType | null
  badgeLabel: string
  badgeColor: string
  badgeBg: string
  to?: string
}) {
  const nameStyle: CSSProperties = {
    color: '#1E293B',
    fontWeight: 600,
    fontSize: 15,
    lineHeight: '20px',
    overflowWrap: 'break-word',
  }
  const nameNode = to ? (
    <Link to={to} style={nameStyle}>
      {name}
    </Link>
  ) : (
    <span style={nameStyle}>{name}</span>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      <MarketplaceTypeTag type={marketplaceType} size={40} />
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
  const queryClient = useQueryClient()
  const canRefresh = canSellerRefreshCabinet(row)
  const remainingLabel = sellerRefreshRemainingLabel(row)

  const refreshMutation = useMutation({
    mutationFn: () => cabinetsApi.triggerDataUpdate(row.id),
    onSuccess: (data) => {
      message.success(data.message || 'Обновление запущено')
      void queryClient.invalidateQueries({ queryKey: ['cabinetsOverview'] })
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err) || 'Не удалось запустить обновление')
    },
  })

  const menuItems: MenuProps['items'] = [
    {
      key: 'open',
      label: <Link to={`/cabinets/${row.id}`}>Перейти в кабинет</Link>,
    },
    {
      key: 'refresh',
      label: 'Обновить данные',
      disabled: !canRefresh || refreshMutation.isPending,
      onClick: () => refreshMutation.mutate(),
    },
  ]

  return (
    <div style={subgridCard()}>
      <CabinetIdentity
        name={row.name}
        marketplaceType={row.marketplaceType}
        badgeLabel="Создан вами"
        badgeColor="#15803D"
        badgeBg="#DCFCE7"
        to={`/cabinets/${row.id}`}
      />
      <ColumnValue>{formatDateShort(row.createdAt)}</ColumnValue>
      <ValidationCell at={row.lastValidatedAt} valid={row.apiKeyValid} />
      <DataUpdateCell
        at={row.lastDataUpdateAt}
        onRefresh={() => refreshMutation.mutate()}
        refreshing={refreshMutation.isPending}
        canRefresh={canRefresh}
        remainingLabel={remainingLabel}
      />
      <ApiTokenCell cabinetId={row.id} masked={row.apiKeyMasked} />
      <RowActionsMenu items={menuItems} />
    </div>
  )
}

function GrantedCabinetRow({ row }: { row: GrantedCabinetRowDto }) {
  return (
    <div style={subgridCard()}>
      <CabinetIdentity
        name={row.name}
        marketplaceType={row.marketplaceType}
        badgeLabel="Доступ предоставлен"
        badgeColor={accent}
        badgeBg="#EDE9FE"
      />
      <ColumnValue>{formatDateShort(row.accessFrom)}</ColumnValue>
      <ColumnValue>{formatAccessUntil(row.accessUntil)}</ColumnValue>
      <ValidationCell at={row.lastValidatedAt} valid={row.apiKeyValid} />
      <DataUpdateCell at={row.lastDataUpdateAt} />
      <ColumnValue>{formatCabinetAccessSections(row.sections)}</ColumnValue>
    </div>
  )
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
    <div style={subgridCard('#FFFBEB')}>
      <CabinetIdentity
        name={row.cabinetName}
        marketplaceType={row.marketplaceType}
        badgeLabel="Ожидает принятия"
        badgeColor="#B45309"
        badgeBg="#FEF3C7"
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

      <div style={{ marginBottom: 24 }} data-tour-id={ONBOARDING_TARGETS.ADD_CABINET}>
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
              <div style={tableGrid(OWNED_COLUMNS)}>
                <div style={subgridHeader()}>
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

          <section data-tour-id={ONBOARDING_TARGETS.GRANTED_ACCESS}>
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
                  <div style={tableGrid(PENDING_COLUMNS)}>
                    <div style={subgridHeader()}>
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
                <div style={tableGrid(GRANTED_COLUMNS)}>
                  <div style={subgridHeader()}>
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
