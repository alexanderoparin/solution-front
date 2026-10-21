import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Dropdown, Input, Spin, Table, Typography, Tag, Tooltip } from 'antd'
import {
  BarChartOutlined,
  CrownOutlined,
  ExperimentOutlined,
  LockOutlined,
  MoreOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { userApi } from '../api/user'
import { subscriptionApi } from '../api/subscription'
import type {
  MarketplaceType,
  PaymentDto,
  UserBillingActivePackageDto,
  UserBillingCabinetRowDto,
  UserBillingOverviewDto,
} from '../types/api'
import { getPaymentStatusLabel, getPaymentStatusColor } from '../utils/paymentStatus'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import MarketplaceTypeTag from '../components/MarketplaceTypeTag'
import AbTestPacksModal from '../components/subscription/AbTestPacksModal'
import AddPackageCabinetsModal from '../components/subscription/AddPackageCabinetsModal'
import TariffPurchaseModal from '../components/subscription/TariffPurchaseModal'
import UpgradePackageModal from '../components/subscription/UpgradePackageModal'
import UpgradeToProModal from '../components/subscription/UpgradeToProModal'
import CustomTariffRequestModal from '../components/subscription/CustomTariffRequestModal'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'

dayjs.locale('ru')

const accent = '#7C3AED'
const border = '#E2E8F0'
const hoverBg = '#F5F3FF'

type PurchaseKind = 'MAIN' | 'CAMPAIGN' | null

type CabinetFilterKey = 'all' | 'free' | 'pro' | 'campaign'

function cabinetFilterKey(row: UserBillingCabinetRowDto): Exclude<CabinetFilterKey, 'all'> {
  if (row.unlimitedAccess) return 'pro'
  if (row.campaignManage) return 'campaign'
  return 'free'
}

function cabinetsWord(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'кабинетов'
  if (mod10 === 1) return 'кабинет'
  if (mod10 >= 2 && mod10 <= 4) return 'кабинета'
  return 'кабинетов'
}

/** Текст до 2 строк; если обрезан — Tooltip с полным значением. */
function TwoLineClamp({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setTruncated(el.scrollHeight > el.clientHeight + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])

  return (
    <Tooltip title={truncated ? text : undefined}>
      <span
        ref={ref}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
          lineHeight: 1.35,
        }}
      >
        {text}
      </span>
    </Tooltip>
  )
}

function packageVolumeLabel(row: UserBillingActivePackageDto): ReactNode {
  if (row.kind === 'AB_PACK') {
    const rem = row.remaining ?? 0
    const used = row.usedStarts ?? 0
    return (
      <>
        доступно {rem},
        <br />
        использовано {used}
      </>
    )
  }
  const count = row.cabinetCount ?? 0
  return `${count} ${cabinetsWord(count)}`
}

function packageVisual(kind: string): { icon: ReactNode; iconBg: string } {
  if (kind === 'AB_PACK') {
    return {
      icon: <ExperimentOutlined style={{ fontSize: 18, color: '#16A34A' }} />,
      iconBg: '#F0FDF4',
    }
  }
  if (kind === 'CAMPAIGN') {
    return {
      icon: <BarChartOutlined style={{ fontSize: 18, color: accent }} />,
      iconBg: '#F5F3FF',
    }
  }
  return {
    icon: <CrownOutlined style={{ fontSize: 18, color: accent }} />,
    iconBg: '#F5F3FF',
  }
}

/** Строка активной подписки в стиле референса. */
function ActivePackageRow({
  row,
  onRenew,
  onBuyAb,
  onAddCabinets,
  onUpgrade,
  onUpgradeToPro,
  last,
}: {
  row: UserBillingActivePackageDto
  onRenew: (kind: 'MAIN' | 'CAMPAIGN') => void
  onBuyAb: () => void
  onAddCabinets?: () => void
  onUpgrade?: () => void
  onUpgradeToPro?: () => void
  last?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const visual = packageVisual(row.kind)
  const isAb = row.kind === 'AB_PACK'
  const actionLabel = isAb ? 'Купить ещё' : 'Продлить'
  const runAction = () => {
    if (isAb) {
      onBuyAb()
      return
    }
    onRenew(row.kind === 'MAIN' ? 'MAIN' : 'CAMPAIGN')
  }

  const moreItems: MenuProps['items'] = []
  if (!isAb && row.canAddCabinets && onAddCabinets) {
    moreItems.push({ key: 'add', label: 'Добавить кабинеты', onClick: onAddCabinets })
  }
  if (!isAb && row.canUpgrade && onUpgrade) {
    moreItems.push({ key: 'upgrade', label: 'Расширить тариф', onClick: onUpgrade })
  }
  if (row.kind === 'CAMPAIGN' && row.canUpgradeToPro && onUpgradeToPro) {
    moreItems.push({ key: 'to-pro', label: 'Улучшить до PRO', onClick: onUpgradeToPro })
  }
  const showMore = moreItems.length > 0

  const rowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '40px minmax(0, 1fr) 84px 108px 118px 36px',
    alignItems: 'center',
    columnGap: 12,
    padding: '14px 8px',
    borderBottom: last ? 'none' : `1px solid ${border}`,
    background: hovered ? hoverBg : 'transparent',
    borderRadius: 10,
    transition: 'background 0.15s',
    margin: '0 -4px',
  }

  return (
    <div
      style={rowStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: visual.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {visual.icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', lineHeight: 1.3 }}>
          {row.title}
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 2, lineHeight: 1.35 }}>
          {packageVolumeLabel(row)}
          {!isAb && row.maxCabinets != null && row.cabinetCount != null && row.cabinetCount < row.maxCabinets && (
            <span style={{ color: '#94A3B8' }}>
              {' '}
              · слотов {row.cabinetCount}/{row.maxCabinets}
            </span>
          )}
        </div>
      </div>

      <div>
        <Tag
          color="success"
          style={{
            borderRadius: 999,
            margin: 0,
            border: '1px solid #BBF7D0',
            background: '#F0FDF4',
            color: '#15803D',
          }}
        >
          {row.status === 'ACTIVE' ? 'Активна' : row.status}
        </Tag>
      </div>

      <div>
        {isAb || !row.expiresAt ? (
          <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.35 }}>
            Пакет,
            <br />
            без срока
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.2 }}>Действует до</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
              {dayjs(row.expiresAt).format('DD.MM.YYYY')}
            </div>
          </>
        )}
      </div>

      <Button
        onClick={runAction}
        style={{
          borderRadius: 8,
          borderColor: border,
          color: accent,
          fontWeight: 600,
          height: 36,
          width: '100%',
        }}
      >
        {actionLabel}
      </Button>

      {showMore ? (
        <Dropdown menu={{ items: moreItems }} trigger={['click']} placement="bottomRight">
          <Button
            type="text"
            icon={<MoreOutlined style={{ fontSize: 18, color: '#94A3B8' }} />}
            style={{ width: 32, height: 32 }}
            aria-label="Ещё"
          />
        </Dropdown>
      ) : (
        <span />
      )}
    </div>
  )
}

/** Карточка услуги с фиолетовой подсветкой при наведении. */
function ServiceOfferCard({
  onClick,
  icon,
  iconBg,
  title,
  description,
}: {
  onClick: () => void
  icon: ReactNode
  iconBg: string
  title: string
  description: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Card
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1.5px solid ${hovered ? accent : border}`,
        borderRadius: 16,
        cursor: 'pointer',
        background: hovered ? hoverBg : '#fff',
        boxShadow: hovered ? '0 4px 14px rgba(124, 58, 237, 0.12)' : 'none',
        transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
      }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: '#0F172A' }}>
            {title}
          </div>
          <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.45 }}>{description}</div>
        </div>
      </div>
    </Card>
  )
}

function FeatureIcon({
  label,
  active,
  icon,
  tooltip,
}: {
  label: string
  active: boolean
  icon: ReactNode
  /** Если задан — вместо стандартного title. */
  tooltip?: string
}) {
  const title = tooltip ?? (active ? label : `${label} (не подключено)`)
  return (
    <Tooltip title={title}>
      <span
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: 8,
          background: active ? '#F5F3FF' : '#F1F5F9',
          color: active ? accent : '#94A3B8',
          fontSize: 15,
        }}
      >
        {icon}
        {!active && (
          <LockOutlined
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              fontSize: 10,
              color: '#64748B',
              background: '#fff',
              borderRadius: '50%',
              padding: 1,
            }}
          />
        )}
      </span>
    </Tooltip>
  )
}

/** Подсказка к иконке A/B: безлимит (PRO) или остаток тестов. */
function abTestsFeatureTooltip(
  row: UserBillingCabinetRowDto,
  quota: { remaining?: number | null; unlimited?: boolean | null; activated?: boolean | null } | null | undefined,
): string {
  if (row.unlimitedAccess || quota?.unlimited) {
    return 'A/B-тесты: безлимит (PRO)'
  }
  if (!row.abTests) {
    return 'A/B-тесты (не подключено)'
  }
  const rem = quota?.remaining
  if (rem == null) {
    return 'A/B-тесты'
  }
  return `A/B-тесты: доступно ${rem}`
}

export default function Subscription() {
  const [purchaseKind, setPurchaseKind] = useState<PurchaseKind>(null)
  const [preselected, setPreselected] = useState<number[] | undefined>()
  const [abOpen, setAbOpen] = useState(false)
  const [cabinetSearch, setCabinetSearch] = useState('')
  const [cabinetFilter, setCabinetFilter] = useState<CabinetFilterKey>('all')
  const [addCabinetsPkg, setAddCabinetsPkg] = useState<UserBillingActivePackageDto | null>(null)
  const [addCabinetsPreselected, setAddCabinetsPreselected] = useState<number[] | undefined>()
  const [upgradePkg, setUpgradePkg] = useState<UserBillingActivePackageDto | null>(null)
  const [upgradePreselected, setUpgradePreselected] = useState<number[] | undefined>()
  const [upgradeToProPkg, setUpgradeToProPkg] = useState<UserBillingActivePackageDto | null>(null)
  const [customRequestOpen, setCustomRequestOpen] = useState(false)

  const {
    data: overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useQuery<UserBillingOverviewDto>({
    queryKey: ['subscriptionOverview'],
    queryFn: () => subscriptionApi.getOverview(),
  })

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentDto[]>({
    queryKey: ['myPayments'],
    queryFn: () => userApi.getMyPayments(),
  })

  const cabinets = overview?.cabinets ?? []
  const packages = overview?.activePackages ?? []

  /**
   * Пакет, в который ещё можно включить кабинет (сначала PRO, иначе РК).
   * Используется для «Подключить»: добор / расширение / заявка.
   */
  const findConnectTargetPackage = (cabinetId: number) => {
    const eligible = packages.filter(
      (p) =>
        (p.kind === 'MAIN' || p.kind === 'CAMPAIGN')
        && p.paymentId != null
        && !(p.cabinetIds ?? []).includes(cabinetId),
    )
    return eligible.find((p) => p.kind === 'MAIN') ?? eligible.find((p) => p.kind === 'CAMPAIGN')
  }

  const openAddCabinets = (pkg: UserBillingActivePackageDto, cabinetIds?: number[]) => {
    setAddCabinetsPreselected(cabinetIds)
    setAddCabinetsPkg(pkg)
  }

  /** «Подключить»: свободный слот → добор; иначе расширение; при max≥10 → заявка. */
  const handleConnectCabinet = (cabinetId: number) => {
    const pkg = findConnectTargetPackage(cabinetId)
    if (!pkg) {
      setPreselected([cabinetId])
      setPurchaseKind('MAIN')
      return
    }
    if (pkg.canAddCabinets) {
      openAddCabinets(pkg, [cabinetId])
      return
    }
    if (pkg.canUpgrade) {
      setUpgradePreselected([cabinetId])
      setUpgradePkg(pkg)
      return
    }
    if ((pkg.maxCabinets ?? 0) >= 10) {
      setCustomRequestOpen(true)
      return
    }
    setPreselected([cabinetId])
    setPurchaseKind('MAIN')
  }

  const cabinetFilterCounts = useMemo(() => {
    const counts: Record<CabinetFilterKey, number> = {
      all: cabinets.length,
      free: 0,
      pro: 0,
      campaign: 0,
    }
    for (const row of cabinets) {
      counts[cabinetFilterKey(row)] += 1
    }
    return counts
  }, [cabinets])

  const filteredCabinets = useMemo(() => {
    const q = cabinetSearch.trim().toLowerCase()
    return cabinets.filter((row) => {
      if (cabinetFilter !== 'all' && cabinetFilterKey(row) !== cabinetFilter) {
        return false
      }
      if (!q) return true
      return (
        row.name.toLowerCase().includes(q)
        || String(row.cabinetId).includes(q)
      )
    })
  }, [cabinets, cabinetFilter, cabinetSearch])

  const cabinetFilterChips: { key: CabinetFilterKey; label: string }[] = [
    { key: 'all', label: 'Все кабинеты' },
    { key: 'free', label: 'Без подписки' },
    { key: 'pro', label: 'Полный доступ' },
    { key: 'campaign', label: 'Управление РК' },
  ]

  const serviceCards = useMemo(
    () => [
      {
        key: 'MAIN' as const,
        title: 'Полный доступ',
        description: 'Товары и аналитика, Сводная, Рекламные кампании, Управление РК, Гипотезы, A/B-тесты.',
        icon: <CrownOutlined style={{ fontSize: 20, color: accent }} />,
        iconBg: '#F5F3FF',
        onClick: () => {
          setPreselected(undefined)
          setPurchaseKind('MAIN')
        },
      },
      {
        key: 'CAMPAIGN' as const,
        title: 'Управление РК',
        description: 'Автоматизация рекламы, ставки, автобюджет, расписание и аналитика кампаний.',
        icon: <ThunderboltOutlined style={{ fontSize: 20, color: accent }} />,
        iconBg: '#F5F3FF',
        onClick: () => {
          setPreselected(undefined)
          setPurchaseKind('CAMPAIGN')
        },
      },
      {
        key: 'AB' as const,
        title: 'A/B-тесты',
        description: 'Пакеты без срока. Квота на аккаунт — для любых ваших кабинетов.',
        icon: <ExperimentOutlined style={{ fontSize: 20, color: '#16A34A' }} />,
        iconBg: '#F0FDF4',
        onClick: () => setAbOpen(true),
      },
    ],
    [],
  )

  const paymentColumns = [
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      width: 96,
      render: (v: number) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(v) + ' ₽'}
        </span>
      ),
    },
    {
      title: 'Назначение',
      dataIndex: 'description',
      key: 'description',
      render: (v: string | null, row: PaymentDto) => (
        <TwoLineClamp text={v || row.planName || '—'} />
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <Tag color={getPaymentStatusColor(v)}>{getPaymentStatusLabel(v)}</Tag>,
    },
  ]

  const cabinetColumns = [
    {
      title: 'Кабинет',
      key: 'name',
      render: (_: unknown, row: UserBillingCabinetRowDto) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {row.marketplaceType && (
            <span style={{ marginTop: 2 }}>
              <MarketplaceTypeTag type={row.marketplaceType as MarketplaceType} size={20} />
            </span>
          )}
          <div>
            <div style={{ fontWeight: 600, color: '#0F172A' }}>{row.name}</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>ID {row.cabinetId}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Тариф',
      dataIndex: 'tariffLabel',
      key: 'tariffLabel',
      render: (v: string) => <span style={{ color: '#334155' }}>{v}</span>,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) =>
        v === 'ACTIVE' ? (
          <Tag color="success" style={{ borderRadius: 999, margin: 0 }}>Активна</Tag>
        ) : (
          <Tag style={{ borderRadius: 999, margin: 0, color: '#64748B' }}>Бесплатный</Tag>
        ),
    },
    {
      title: 'До',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : '—'),
    },
    {
      title: 'Функции',
      key: 'features',
      render: (_: unknown, row: UserBillingCabinetRowDto) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
          <FeatureIcon label="Управление РК" active={row.campaignManage} icon={<ThunderboltOutlined />} />
          <FeatureIcon
            label="A/B-тесты"
            active={row.abTests}
            icon={<ExperimentOutlined />}
            tooltip={abTestsFeatureTooltip(row, overview?.abTestQuota)}
          />
        </div>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      align: 'right' as const,
      render: (_: unknown, row: UserBillingCabinetRowDto) => {
        const btnStyle: CSSProperties = {
          width: 124,
          borderRadius: 10,
          fontWeight: 600,
        }
        if (row.unlimitedAccess) {
          return (
            <Button
              type="default"
              style={btnStyle}
              onClick={() => {
                setPreselected([row.cabinetId])
                setPurchaseKind('MAIN')
              }}
            >
              Продлить
            </Button>
          )
        }
        if (row.campaignManage && !row.unlimitedAccess) {
          return (
            <Button
              type="default"
              style={btnStyle}
              onClick={() => {
                setPreselected([row.cabinetId])
                setPurchaseKind('CAMPAIGN')
              }}
            >
              Продлить
            </Button>
          )
        }
        return (
          <Button
            type="primary"
            style={{ ...btnStyle, background: accent, borderColor: accent }}
            onClick={() => handleConnectCabinet(row.cabinetId)}
          >
            Подключить
          </Button>
        )
      },
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Header />
      <Breadcrumbs />
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 24px 48px' }}>
        <Typography.Title level={3} style={{ margin: '0 0 6px', color: '#0F172A', fontWeight: 700 }}>
          Подписка и тарифы
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24, fontSize: 14 }}>
          Подключайте полный доступ или отдельные услуги для выбранных кабинетов.
        </Typography.Paragraph>

        <div
          className="subscription-service-cards"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {serviceCards.map((card) => (
            <ServiceOfferCard
              key={card.key}
              onClick={card.onClick}
              icon={card.icon}
              iconBg={card.iconBg}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>

        {overviewLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
        ) : (
          <>
            <div
              className="subscription-split"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                marginBottom: 24,
                alignItems: 'stretch',
              }}
            >
              <Card
                title={<span style={{ fontWeight: 700 }}>Текущие подписки</span>}
                style={{ borderRadius: 16, borderColor: border, height: '100%' }}
                styles={{ body: { paddingTop: 4, paddingBottom: 8 } }}
              >
                {packages.length === 0 ? (
                  <div style={{ color: '#94A3B8', padding: '12px 4px' }}>Нет активных подписок</div>
                ) : (
                  <div>
                    {packages.map((row, index) => (
                      <ActivePackageRow
                        key={`${row.kind}-${row.paymentId ?? 'x'}-${row.expiresAt ?? 'none'}-${index}`}
                        row={row}
                        last={index === packages.length - 1}
                        onBuyAb={() => setAbOpen(true)}
                        onRenew={(kind) => {
                          setPreselected(row.cabinetIds ?? undefined)
                          setPurchaseKind(kind)
                        }}
                        onAddCabinets={
                          row.canAddCabinets ? () => openAddCabinets(row) : undefined
                        }
                        onUpgrade={
                          row.canUpgrade
                            ? () => {
                                setUpgradePreselected(undefined)
                                setUpgradePkg(row)
                              }
                            : undefined
                        }
                        onUpgradeToPro={
                          row.canUpgradeToPro ? () => setUpgradeToProPkg(row) : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </Card>
              <Card
                title={<span style={{ fontWeight: 700 }}>История платежей</span>}
                style={{ borderRadius: 16, borderColor: border, height: '100%' }}
                styles={{ body: { paddingTop: 4, paddingBottom: 8 } }}
              >
                {payments.length === 0 && !paymentsLoading ? (
                  <div style={{ color: '#94A3B8', padding: '12px 4px' }}>Платежей пока нет</div>
                ) : (
                  <Table
                    className="subscription-payments-table"
                    size="small"
                    rowKey="id"
                    loading={paymentsLoading}
                    showHeader={payments.length > 0}
                    pagination={
                      payments.length > 3
                        ? { pageSize: 3, size: 'small' }
                        : false
                    }
                    dataSource={payments}
                    columns={paymentColumns}
                  />
                )}
              </Card>
            </div>

            <Card
              style={{ borderRadius: 16, borderColor: border }}
              styles={{
                header: { display: 'none' },
                body: { padding: '20px 24px 16px' },
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 16, color: '#0F172A', flexShrink: 0 }}>
                  Все кабинеты
                </span>
                <Input
                  allowClear
                  prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                  placeholder="Поиск по кабинетам, ID или названию"
                  value={cabinetSearch}
                  onChange={(e) => setCabinetSearch(e.target.value)}
                  style={{ borderRadius: 8, flex: '1 1 200px', minWidth: 180, maxWidth: 340 }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginLeft: 'auto' }}>
                  {cabinetFilterChips.map((chip) => {
                    const active = cabinetFilter === chip.key
                    const count = cabinetFilterCounts[chip.key]
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => setCabinetFilter(chip.key)}
                        style={{
                          border: `1px solid ${active ? accent : border}`,
                          background: active ? accent : '#fff',
                          color: active ? '#fff' : '#334155',
                          borderRadius: 999,
                          padding: '4px 12px',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          lineHeight: 1.4,
                        }}
                      >
                        {chip.label}{' '}
                        <span style={{ opacity: active ? 0.9 : 0.65 }}>{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <Table
                size="middle"
                rowKey="cabinetId"
                dataSource={filteredCabinets}
                columns={cabinetColumns}
                pagination={false}
                locale={{
                  emptyText: cabinets.length === 0
                    ? 'Создайте кабинет, чтобы подключить тариф'
                    : 'Ничего не найдено',
                }}
              />
            </Card>
          </>
        )}
      </div>

      {purchaseKind && (
        <TariffPurchaseModal
          open
          kind={purchaseKind}
          preselectedCabinetIds={preselected}
          cabinetRows={cabinets}
          onClose={() => {
            setPurchaseKind(null)
            setPreselected(undefined)
          }}
        />
      )}

      <AbTestPacksModal
        open={abOpen}
        onClose={() => setAbOpen(false)}
        onActivated={() => {
          void refetchOverview()
          setAbOpen(false)
        }}
      />

      <AddPackageCabinetsModal
        open={!!addCabinetsPkg}
        pkg={addCabinetsPkg}
        cabinetRows={cabinets}
        preselectedCabinetIds={addCabinetsPreselected}
        onClose={() => {
          setAddCabinetsPkg(null)
          setAddCabinetsPreselected(undefined)
        }}
      />

      <UpgradePackageModal
        open={!!upgradePkg}
        pkg={upgradePkg}
        cabinetRows={cabinets}
        preselectedCabinetIds={upgradePreselected}
        onClose={() => {
          setUpgradePkg(null)
          setUpgradePreselected(undefined)
        }}
      />

      <UpgradeToProModal
        open={!!upgradeToProPkg}
        pkg={upgradeToProPkg}
        cabinetRows={cabinets}
        onClose={() => setUpgradeToProPkg(null)}
      />

      <CustomTariffRequestModal
        open={customRequestOpen}
        onClose={() => setCustomRequestOpen(false)}
      />

      <style>{`
        .subscription-payments-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none;
        }
        .subscription-payments-table .ant-table-container::before,
        .subscription-payments-table .ant-table-container::after {
          display: none !important;
        }
        @media (max-width: 960px) {
          .subscription-split { grid-template-columns: 1fr !important; }
          .subscription-service-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
