import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Spin, Table, Typography, Tag, Tooltip } from 'antd'
import {
  CrownOutlined,
  ExperimentOutlined,
  LockOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { userApi } from '../api/user'
import { subscriptionApi } from '../api/subscription'
import type { MarketplaceType, PaymentDto, UserBillingCabinetRowDto, UserBillingOverviewDto } from '../types/api'
import { getPaymentStatusLabel, getPaymentStatusColor } from '../utils/paymentStatus'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import MarketplaceTypeTag from '../components/MarketplaceTypeTag'
import AbTestPacksModal from '../components/subscription/AbTestPacksModal'
import TariffPurchaseModal from '../components/subscription/TariffPurchaseModal'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'

dayjs.locale('ru')

const accent = '#7C3AED'
const border = '#E2E8F0'

type PurchaseKind = 'MAIN' | 'CAMPAIGN' | null

function FeatureIcon({
  label,
  active,
  icon,
}: {
  label: string
  active: boolean
  icon: ReactNode
}) {
  return (
    <Tooltip title={active ? label : `${label} (не подключено)`}>
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

export default function Subscription() {
  const [purchaseKind, setPurchaseKind] = useState<PurchaseKind>(null)
  const [preselected, setPreselected] = useState<number[] | undefined>()
  const [abOpen, setAbOpen] = useState(false)

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

  const packageColumns = [
    {
      title: 'Услуга',
      dataIndex: 'title',
      key: 'title',
      render: (v: string) => <span style={{ fontWeight: 500, color: '#0F172A' }}>{v}</span>,
    },
    {
      title: 'Объём',
      key: 'volume',
      render: (_: unknown, row: UserBillingOverviewDto['activePackages'][0]) => {
        if (row.kind === 'AB_PACK') {
          const rem = row.remaining ?? 0
          const used = row.usedStarts ?? 0
          const total = rem + used
          return total > 0 ? `${used} из ${total} тестов использовано` : `${rem} тестов`
        }
        return row.cabinetCount != null ? `${row.cabinetCount} каб.` : '—'
      },
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color="success" style={{ borderRadius: 999, margin: 0 }}>
          {v === 'ACTIVE' ? 'Активна' : v}
        </Tag>
      ),
    },
    {
      title: 'Действует до',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : 'Без срока'),
    },
    {
      title: '',
      key: 'actions',
      width: 110,
      render: (_: unknown, row: UserBillingOverviewDto['activePackages'][0]) => {
        if (row.kind === 'AB_PACK') {
          return (
            <Button type="link" style={{ paddingInline: 0 }} onClick={() => setAbOpen(true)}>
              Купить ещё
            </Button>
          )
        }
        return (
          <Button
            type="link"
            style={{ paddingInline: 0 }}
            onClick={() => {
              setPreselected(undefined)
              setPurchaseKind(row.kind === 'MAIN' ? 'MAIN' : 'CAMPAIGN')
            }}
          >
            Продлить
          </Button>
        )
      },
    },
  ]

  const paymentColumns = [
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) =>
        new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(v) + ' ₽',
    },
    {
      title: 'Назначение',
      dataIndex: 'description',
      key: 'description',
      render: (v: string | null, row: PaymentDto) => v || row.planName || '—',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
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
          <FeatureIcon label="A/B-тесты" active={row.abTests} icon={<ExperimentOutlined />} />
        </div>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, row: UserBillingCabinetRowDto) => {
        if (row.unlimitedAccess) {
          return (
            <Button
              type="default"
              onClick={() => {
                setPreselected([row.cabinetId])
                setPurchaseKind('MAIN')
              }}
            >
              Управление
            </Button>
          )
        }
        if (row.campaignManage && !row.unlimitedAccess) {
          return (
            <Button
              type="default"
              onClick={() => {
                setPreselected([row.cabinetId])
                setPurchaseKind('CAMPAIGN')
              }}
            >
              Управление
            </Button>
          )
        }
        return (
          <Button
            type="primary"
            style={{ background: accent, borderColor: accent, borderRadius: 10, fontWeight: 600 }}
            onClick={() => {
              setPreselected([row.cabinetId])
              setPurchaseKind('MAIN')
            }}
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
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 24px 48px' }}>
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
            <Card
              key={card.key}
              hoverable
              onClick={card.onClick}
              style={{ borderColor: border, borderRadius: 16, cursor: 'pointer' }}
              styles={{ body: { padding: 20 } }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: card.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: '#0F172A' }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.45 }}>
                    {card.description}
                  </div>
                </div>
              </div>
            </Card>
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
              }}
            >
              <Card
                title={<span style={{ fontWeight: 700 }}>Текущие подписки</span>}
                style={{ borderRadius: 16, borderColor: border }}
                styles={{ body: { paddingTop: 8 } }}
              >
                <Table
                  size="small"
                  rowKey={(_, i) => String(i)}
                  pagination={false}
                  dataSource={packages}
                  columns={packageColumns}
                  locale={{ emptyText: 'Нет активных подписок' }}
                />
              </Card>
              <Card
                title={<span style={{ fontWeight: 700 }}>История платежей</span>}
                style={{ borderRadius: 16, borderColor: border }}
                styles={{ body: { paddingTop: 8 } }}
              >
                <Table
                  size="small"
                  rowKey="id"
                  loading={paymentsLoading}
                  pagination={{ pageSize: 5, hideOnSinglePage: true }}
                  dataSource={payments}
                  columns={paymentColumns}
                  locale={{ emptyText: 'Платежей пока нет' }}
                />
              </Card>
            </div>

            <Card
              title={<span style={{ fontWeight: 700 }}>Все кабинеты</span>}
              style={{ borderRadius: 16, borderColor: border }}
              styles={{ body: { paddingTop: 8 } }}
            >
              <Table
                size="middle"
                rowKey="cabinetId"
                dataSource={cabinets}
                columns={cabinetColumns}
                pagination={false}
                locale={{ emptyText: 'Создайте кабинет, чтобы подключить тариф' }}
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

      <style>{`
        @media (max-width: 960px) {
          .subscription-split { grid-template-columns: 1fr !important; }
          .subscription-service-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
