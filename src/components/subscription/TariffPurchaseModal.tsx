import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Input, Modal, Radio, Spin, message } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '../../api/subscription'
import { cabinetsApi } from '../../api/cabinets'
import type { PlanDto, UserBillingCabinetRowDto } from '../../types/api'

const accent = '#7C3AED'
const CONTACT_URL = 'https://t.me/kaypavel'

/** Тиры UI: лейбл max → min/max в планах. */
const TIERS = [
  { key: '1', label: '1 кабинет', min: 1, max: 1 },
  { key: '5', label: '5 кабинетов', min: 2, max: 5 },
  { key: '10', label: '10 кабинетов', min: 6, max: 10 },
] as const

type PeriodKey = '14d' | 'month'

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
    setTierKey('1')
    setPeriod('month')
    setSearch('')
    setSelectedIds(preselectedCabinetIds?.length ? [...preselectedCabinetIds] : [])
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

  const title = kind === 'MAIN' ? 'Подключение тарифа «Полный доступ»' : 'Подключение «Управление РК»'
  const loading = plansLoading || cabinetsLoading

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      title={title}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Выберите количество кабинетов</div>
            <Radio.Group
              value={tierKey}
              onChange={(e) => {
                setTierKey(e.target.value)
                setSelectedIds((prev) => prev.slice(0, TIERS.find((t) => t.key === e.target.value)?.max ?? 1))
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}
            >
              {TIERS.map((t) => {
                const mp = plans.find((p) => matchTier(p, t.min, t.max) && isMonthPlan(p))
                return (
                  <Radio key={t.key} value={t.key} style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                    {t.label}
                    {mp ? ` — ${formatRub(mp.priceRub)} / 1 месяц` : ''}
                  </Radio>
                )
              })}
              <div
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  color: '#64748B',
                }}
              >
                Свыше 10 —{' '}
                <a href={CONTACT_URL} target="_blank" rel="noreferrer" style={{ color: accent }}>
                  по запросу
                </a>
              </div>
            </Radio.Group>
          </div>

          <div>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Выберите срок</div>
            <Radio.Group
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}
            >
              <Radio value="14d" style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8 }} disabled={!day14Plan}>
                14 дней{day14Plan ? ` — ${formatRub(day14Plan.priceRub)}` : ''}
              </Radio>
              <Radio value="month" style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8 }} disabled={!monthPlan}>
                1 месяц{monthPlan ? ` — ${formatRub(monthPlan.priceRub)}` : ''}
              </Radio>
            </Radio.Group>
          </div>

          <div>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Выберите кабинеты</div>
            <Input
              allowClear
              placeholder="Поиск по названию или ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8, padding: 8 }}>
              {filteredCabinets.length === 0 ? (
                <div style={{ color: '#94A3B8', padding: 8 }}>Нет доступных кабинетов</div>
              ) : (
                filteredCabinets.map((c) => {
                  const covered = coverInfo(c.id)
                  const checked = selectedIds.includes(c.id)
                  const atLimit = !checked && selectedIds.length >= tier.max
                  return (
                    <label
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '8px 6px',
                        cursor: atLimit ? 'not-allowed' : 'pointer',
                        opacity: atLimit ? 0.5 : 1,
                      }}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={atLimit}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => [...prev, c.id].slice(0, tier.max))
                          } else {
                            setSelectedIds((prev) => prev.filter((id) => id !== c.id))
                          }
                        }}
                      />
                      <span style={{ flex: 1 }}>
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                        <span style={{ color: '#94A3B8', marginLeft: 8 }}>ID {c.id}</span>
                        {covered && (
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{covered}</div>
                        )}
                      </span>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              borderTop: '1px solid #E2E8F0',
              paddingTop: 16,
            }}
          >
            <div style={{ color: '#64748B', fontSize: 13 }}>
              Выбрано: {selectedIds.length} из {tier.max}
              {selectedIds.length > 0 && selectedIds.length < tier.min && (
                <span style={{ color: '#DC2626', marginLeft: 8 }}>
                  (минимум {tier.min})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontWeight: 700 }}>
                К оплате: {selectedPlan ? formatRub(selectedPlan.priceRub) : '—'}
              </div>
              <Button onClick={onClose}>Отмена</Button>
              <Button
                type="primary"
                style={{ background: accent, borderColor: accent }}
                loading={payMutation.isPending}
                disabled={
                  !selectedPlan
                  || selectedIds.length < tier.min
                  || selectedIds.length > tier.max
                }
                onClick={() => payMutation.mutate()}
              >
                Перейти к оплате →
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU')
  } catch {
    return iso
  }
}
