import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Button, Checkbox, Input, Modal, Spin, message } from 'antd'
import {
  CrownOutlined,
  MailOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '../../api/subscription'
import { cabinetsApi } from '../../api/cabinets'
import type { MarketplaceType, PlanDto, UserBillingCabinetRowDto } from '../../types/api'
import MarketplaceTypeTag from '../MarketplaceTypeTag'
import CustomTariffRequestModal from './CustomTariffRequestModal'

const accent = '#7C3AED'
const border = '#E2E8F0'

/** Тиры UI: лейбл пакета → min/max в планах. */
const TIERS = [
  { key: '1', label: '1 кабинет', min: 1, max: 1 },
  { key: '5', label: '2–5 кабинетов', min: 2, max: 5 },
  { key: '10', label: '6–10 кабинетов', min: 6, max: 10 },
] as const

const MAX_SELF_SERVE_CABINETS = 10

type PeriodKey = '14d' | 'month'

/** Тир по числу выбранных кабинетов (0 → первый пакет). */
function tierKeyForCount(count: number): string {
  if (count <= 1) return '1'
  if (count <= 5) return '5'
  return '10'
}

function cabinetsWord(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'кабинетов'
  if (mod10 === 1) return 'кабинет'
  if (mod10 >= 2 && mod10 <= 4) return 'кабинета'
  return 'кабинетов'
}

interface TariffPurchaseModalProps {
  open: boolean
  kind: 'MAIN' | 'CAMPAIGN'
  /** Предвыбор кабинетов (например продление). */
  preselectedCabinetIds?: number[]
  cabinetRows?: UserBillingCabinetRowDto[]
  onClose: () => void
}

function formatRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽'
}

function isMonthPlan(plan: PlanDto): boolean {
  return plan.periodType === 'CALENDAR_MONTH'
}

function is14dPlan(plan: PlanDto): boolean {
  return plan.periodType === 'DAYS' && plan.periodDays === 14
}

function matchTier(plan: PlanDto, min: number, max: number): boolean {
  return (plan.minCabinets ?? 1) === min && (plan.maxCabinets ?? max) === max
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU')
  } catch {
    return iso
  }
}

const sectionTitleStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: 14,
  color: '#0F172A',
  marginBottom: 12,
}

const hoverBg = '#F5F3FF'

/** Строка кабинета в списке выбора — подсветка при наведении / выборе. */
function CabinetPickRow({
  checked,
  atLimit,
  name,
  covered,
  marketplaceType,
  cabinetId,
  onToggle,
}: {
  checked: boolean
  atLimit: boolean
  name: string
  covered: string | null
  marketplaceType?: MarketplaceType | null
  cabinetId: number
  onToggle: (checked: boolean) => void
}) {
  const [hovered, setHovered] = useState(false)
  const highlight = checked || (hovered && !atLimit)
  return (
    <label
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 72px',
        gap: 10,
        alignItems: 'center',
        padding: '10px 12px',
        borderBottom: `1px solid ${border}`,
        background: highlight ? hoverBg : '#fff',
        cursor: atLimit ? 'not-allowed' : 'pointer',
        opacity: atLimit ? 0.45 : 1,
        margin: 0,
        transition: 'background 0.15s',
      }}
    >
      <Checkbox checked={checked} disabled={atLimit} onChange={(e) => onToggle(e.target.checked)} />
      <span style={{ minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ display: 'inline-flex', marginTop: 2, flexShrink: 0 }}>
          <MarketplaceTypeTag type={marketplaceType} size={18} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ fontWeight: 500, color: '#0F172A', display: 'block' }}>{name}</span>
          {covered && <span style={{ fontSize: 12, color: '#64748B' }}>{covered}</span>}
        </span>
      </span>
      <span style={{ textAlign: 'right', color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>
        {cabinetId}
      </span>
    </label>
  )
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: `2px solid ${selected ? accent : '#CBD5E1'}`,
        background: '#fff',
        boxShadow: selected ? `inset 0 0 0 4px ${accent}` : undefined,
        flexShrink: 0,
      }}
    />
  )
}

/**
 * Карточка-плитка в ряд.
 * compact — тиры без цены (низкие); обычная — срок с крупной ценой.
 */
function SelectTile({
  selected,
  disabled,
  onClick,
  compact,
  children,
}: {
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  compact?: boolean
  children: ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  const isSelected = !!selected
  const highlight = isSelected || (hovered && !disabled)
  const base: CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: compact ? 'center' : 'space-between',
    gap: compact ? 4 : 10,
    minHeight: compact ? undefined : 96,
    padding: compact ? '12px 12px' : '14px 16px',
    borderRadius: 12,
    border: `2px solid ${highlight ? accent : border}`,
    background: highlight ? '#F5F3FF' : '#fff',
    boxShadow: hovered && !disabled && !isSelected ? '0 4px 14px rgba(124, 58, 237, 0.12)' : 'none',
    boxSizing: 'border-box',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    color: '#0F172A',
    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
    userSelect: 'none',
    width: '100%',
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (!disabled) onClick?.()
      }}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      style={base}
    >
      {children}
    </div>
  )
}

export default function TariffPurchaseModal({
  open,
  kind,
  preselectedCabinetIds,
  cabinetRows,
  onClose,
}: TariffPurchaseModalProps) {
  const [tierKey, setTierKey] = useState<string>('1')
  const [period, setPeriod] = useState<PeriodKey>('month')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [customRequestOpen, setCustomRequestOpen] = useState(false)

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans', kind],
    queryFn: () => subscriptionApi.getPlans(kind),
    enabled: open,
  })

  const { data: overview, isLoading: cabinetsLoading } = useQuery({
    queryKey: ['cabinetsOverview'],
    queryFn: () => cabinetsApi.getOverview(),
    enabled: open,
  })

  const owned = overview?.owned ?? []

  useEffect(() => {
    if (!open) return
    setPeriod('month')
    setSearch('')
    const initial = preselectedCabinetIds?.length
      ? preselectedCabinetIds.slice(0, MAX_SELF_SERVE_CABINETS)
      : []
    setSelectedIds(initial)
    setTierKey(tierKeyForCount(initial.length))
  }, [open, preselectedCabinetIds])

  const tier = TIERS.find((t) => t.key === tierKey) ?? TIERS[0]

  const monthPlan = useMemo(
    () => plans.find((p) => matchTier(p, tier.min, tier.max) && isMonthPlan(p)),
    [plans, tier],
  )
  const day14Plan = useMemo(
    () => plans.find((p) => matchTier(p, tier.min, tier.max) && is14dPlan(p)),
    [plans, tier],
  )
  const selectedPlan = period === 'month' ? monthPlan : day14Plan

  const filteredCabinets = useMemo(() => {
    const q = search.trim().toLowerCase()
    return owned.filter((c) => {
      if (!q) return true
      return c.name.toLowerCase().includes(q) || String(c.id).includes(q)
    })
  }, [owned, search])

  const filteredIds = useMemo(() => filteredCabinets.map((c) => c.id), [filteredCabinets])
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id))
  const someFilteredSelected = filteredIds.some((id) => selectedIds.includes(id))

  const coverInfo = (cabinetId: number) => {
    const row = cabinetRows?.find((r) => r.cabinetId === cabinetId)
    if (!row) return null
    if (kind === 'MAIN' && row.unlimitedAccess) {
      return row.expiresAt ? `Полный доступ до ${formatDate(row.expiresAt)}` : 'Полный доступ'
    }
    if (kind === 'CAMPAIGN' && row.campaignManage && !row.unlimitedAccess) {
      return row.expiresAt ? `Управление РК до ${formatDate(row.expiresAt)}` : 'Управление РК активно'
    }
    if (kind === 'CAMPAIGN' && row.unlimitedAccess) {
      return 'Входит в полный доступ'
    }
    return null
  }

  const applySelection = (next: number[]) => {
    const clipped = next.slice(0, MAX_SELF_SERVE_CABINETS)
    setSelectedIds(clipped)
    setTierKey(tierKeyForCount(clipped.length))
  }

  const toggleCabinet = (id: number, checked: boolean) => {
    if (checked) {
      if (selectedIds.includes(id) || selectedIds.length >= MAX_SELF_SERVE_CABINETS) return
      applySelection([...selectedIds, id])
      return
    }
    applySelection(selectedIds.filter((x) => x !== id))
  }

  const toggleAllFiltered = (checked: boolean) => {
    if (!checked) {
      applySelection(selectedIds.filter((id) => !filteredIds.includes(id)))
      return
    }
    const merged = [...selectedIds]
    for (const id of filteredIds) {
      if (merged.length >= MAX_SELF_SERVE_CABINETS) break
      if (!merged.includes(id)) merged.push(id)
    }
    applySelection(merged)
  }

  const selectTier = (key: string) => {
    setTierKey(key)
    const max = TIERS.find((t) => t.key === key)?.max ?? 1
    setSelectedIds((prev) => prev.slice(0, max))
  }

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) throw new Error('План не найден')
      const count = selectedIds.length
      if (count < tier.min || count > tier.max) {
        throw new Error(`Выберите от ${tier.min} до ${tier.max} кабинетов`)
      }
      return subscriptionApi.initiatePayment(selectedPlan.id, selectedIds)
    },
    onSuccess: (res) => {
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl
        return
      }
      message.error('Не удалось получить ссылку на оплату')
    },
    onError: (e: Error) => {
      message.error(e.message || 'Ошибка оплаты')
    },
  })

  const titleText =
    kind === 'MAIN' ? 'Подключение тарифа «Полный доступ»' : 'Подключение «Управление РК»'
  const titleIcon =
    kind === 'MAIN' ? (
      <CrownOutlined style={{ color: accent, fontSize: 20 }} />
    ) : (
      <ThunderboltOutlined style={{ color: accent, fontSize: 20 }} />
    )
  const loading = plansLoading || cabinetsLoading
  const canPay =
    !!selectedPlan
    && selectedIds.length >= tier.min
    && selectedIds.length <= tier.max

  return (
    <>
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {titleIcon}
          <span>{titleText}</span>
        </span>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* 1. Тиры — 4 плитки в ряд */}
          <div>
            <div style={sectionTitleStyle}>1. Выберите количество кабинетов</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              {TIERS.map((t) => {
                const selected = tierKey === t.key
                return (
                  <SelectTile key={t.key} compact selected={selected} onClick={() => selectTier(t.key)}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        gap: 6,
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.25 }}>{t.label}</span>
                      <RadioDot selected={selected} />
                    </div>
                  </SelectTile>
                )
              })}
              <SelectTile compact onClick={() => setCustomRequestOpen(true)}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    width: '100%',
                    gap: 6,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.25 }}>Свыше 10</div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: accent, marginTop: 2 }}>
                      По запросу
                    </div>
                  </div>
                  <MailOutlined style={{ color: accent, fontSize: 16, marginTop: 1 }} />
                </div>
              </SelectTile>
            </div>
          </div>

          {/* 2. Срок — 2 плитки рядом */}
          <div>
            <div style={sectionTitleStyle}>2. Выберите срок</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              <SelectTile
                selected={period === '14d'}
                disabled={!day14Plan}
                onClick={() => setPeriod('14d')}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    width: '100%',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14 }}>14 дней</span>
                  <RadioDot selected={period === '14d'} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 20, color: '#0F172A' }}>
                  {day14Plan ? formatRub(day14Plan.priceRub) : '—'}
                </div>
              </SelectTile>
              <SelectTile
                selected={period === 'month'}
                disabled={!monthPlan}
                onClick={() => setPeriod('month')}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    width: '100%',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14 }}>1 месяц</span>
                  <RadioDot selected={period === 'month'} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 20, color: '#0F172A' }}>
                  {monthPlan ? formatRub(monthPlan.priceRub) : '—'}
                </div>
              </SelectTile>
            </div>
          </div>

          {/* 3. Кабинеты */}
          <div>
            <div style={sectionTitleStyle}>3. Выберите кабинеты</div>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              placeholder="Поиск по кабинетам"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 10, borderRadius: 8 }}
            />
            <div
              style={{
                maxHeight: 240,
                overflowY: 'auto',
                border: `1px solid ${border}`,
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr 72px',
                  gap: 10,
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderBottom: `1px solid ${border}`,
                  background: '#F8FAFC',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                }}
              >
                <Checkbox
                  checked={allFilteredSelected}
                  indeterminate={!allFilteredSelected && someFilteredSelected}
                  disabled={filteredIds.length === 0}
                  onChange={(e) => toggleAllFiltered(e.target.checked)}
                />
                <span>Кабинет</span>
                <span style={{ textAlign: 'right' }}>ID</span>
              </div>

              {filteredCabinets.length === 0 ? (
                <div style={{ color: '#94A3B8', padding: 16 }}>Нет доступных кабинетов</div>
              ) : (
                filteredCabinets.map((c) => {
                  const covered = coverInfo(c.id)
                  const checked = selectedIds.includes(c.id)
                  const atLimit = !checked && selectedIds.length >= MAX_SELF_SERVE_CABINETS
                  return (
                    <CabinetPickRow
                      key={c.id}
                      checked={checked}
                      atLimit={atLimit}
                      name={c.name}
                      covered={covered}
                      marketplaceType={c.marketplaceType}
                      cabinetId={c.id}
                      onToggle={(next) => toggleCabinet(c.id, next)}
                    />
                  )
                })
              )}
            </div>
            {selectedIds.length > 0 && selectedIds.length < tier.min && (
              <div style={{ color: '#DC2626', fontSize: 12, marginTop: 8 }}>
                Для этого пакета нужно выбрать ещё {tier.min - selectedIds.length}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              borderTop: `1px solid ${border}`,
              paddingTop: 16,
            }}
          >
            <div style={{ color: '#64748B', fontSize: 14 }}>
              Выбрано: {selectedIds.length} {cabinetsWord(selectedIds.length)}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>
              К оплате: {selectedPlan ? formatRub(selectedPlan.priceRub) : '—'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={onClose} style={{ borderRadius: 8, height: 40, minWidth: 100 }}>
              Отмена
            </Button>
            <Button
              type="primary"
              style={{
                background: accent,
                borderColor: accent,
                borderRadius: 8,
                height: 40,
                fontWeight: 600,
                paddingInline: 18,
              }}
              loading={payMutation.isPending}
              disabled={!canPay}
              onClick={() => payMutation.mutate()}
            >
              Перейти к оплате →
            </Button>
          </div>
        </div>
      )}
    </Modal>
    <CustomTariffRequestModal
      open={customRequestOpen}
      onClose={() => setCustomRequestOpen(false)}
    />
    </>
  )
}
