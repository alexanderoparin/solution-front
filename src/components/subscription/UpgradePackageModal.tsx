import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Input, Modal, Radio, Spin, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { cabinetsApi } from '../../api/cabinets'
import { subscriptionApi } from '../../api/subscription'
import type { PlanDto, UserBillingActivePackageDto, UserBillingCabinetRowDto } from '../../types/api'
import MarketplaceTypeTag from '../MarketplaceTypeTag'
import PurchaseConfirmModal from './PurchaseConfirmModal'

const accent = '#7C3AED'
const border = '#E2E8F0'

interface UpgradePackageModalProps {
  open: boolean
  pkg: UserBillingActivePackageDto | null
  cabinetRows: UserBillingCabinetRowDto[]
  /** Предвыбор кабинетов для добора после расширения (например с «Подключить»). */
  preselectedCabinetIds?: number[]
  onClose: () => void
}

function formatRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽'
}

/** Склонение для фразы «до N …» (до 1 кабинета, до 5 кабинетов). */
function cabinetsWordAfterDo(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'кабинетов'
  if (mod10 === 1) return 'кабинета'
  return 'кабинетов'
}

function cabinetsWord(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'кабинетов'
  if (mod10 === 1) return 'кабинет'
  if (mod10 >= 2 && mod10 <= 4) return 'кабинета'
  return 'кабинетов'
}

/** Минимальный тир апгрейда, в который влезает нужное число кабинетов. */
function pickPlanForCabinetCount(targets: PlanDto[], needed: number): PlanDto | null {
  if (targets.length === 0) return null
  const sorted = [...targets].sort(
    (a, b) => (a.maxCabinets ?? 0) - (b.maxCabinets ?? 0),
  )
  const fit = sorted.find((p) => (p.maxCabinets ?? 1) >= needed)
  return fit ?? sorted[sorted.length - 1] ?? null
}

/**
 * Апгрейд тира пакета вверх с prorate-доплатой (срок не меняется).
 * Показывает кабинеты уже в пакете и позволяет выбрать новые под слоты целевого тира.
 */
export default function UpgradePackageModal({
  open,
  pkg,
  cabinetRows,
  preselectedCabinetIds,
  onClose,
}: UpgradePackageModalProps) {
  const [targetPlanId, setTargetPlanId] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [preselectApplied, setPreselectApplied] = useState(false)

  const { data: targets = [], isLoading: targetsLoading } = useQuery({
    queryKey: ['upgradeTargets', pkg?.paymentId],
    queryFn: () => subscriptionApi.getUpgradeTargets(pkg!.paymentId!),
    enabled: open && !!pkg?.paymentId,
  })

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['upgradeQuote', pkg?.paymentId, targetPlanId],
    queryFn: () => subscriptionApi.getUpgradeQuote(pkg!.paymentId!, targetPlanId!),
    enabled: open && !!pkg?.paymentId && targetPlanId != null,
  })

  const { data: overview, isLoading: cabinetsLoading } = useQuery({
    queryKey: ['cabinetsOverview'],
    queryFn: () => cabinetsApi.getOverview(),
    enabled: open,
  })

  const inPackageIds = useMemo(() => new Set(pkg?.cabinetIds ?? []), [pkg])
  const owned = overview?.owned ?? []

  const inPackageCabinets = useMemo(
    () => owned.filter((c) => inPackageIds.has(c.id)),
    [owned, inPackageIds],
  )

  const used = pkg?.cabinetCount ?? inPackageIds.size
  const absoluteMax = useMemo(
    () => targets.reduce((m, p) => Math.max(m, p.maxCabinets ?? 0), pkg?.maxCabinets ?? 0),
    [targets, pkg?.maxCabinets],
  )
  /** Лимит выбора — по самому большому доступному тиру (тир подстроится сам). */
  const selectLimit = Math.max(0, absoluteMax - used)
  const selectedTarget = targets.find((p) => p.id === targetPlanId)
  const targetMax = selectedTarget?.maxCabinets ?? quote?.targetMaxCabinets ?? pkg?.maxCabinets ?? 1
  const planFreeSlots = Math.max(0, targetMax - used)

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    return owned.filter((c) => {
      if (inPackageIds.has(c.id)) return false
      const row = cabinetRows.find((r) => r.cabinetId === c.id)
      if (pkg?.kind === 'MAIN' && row?.unlimitedAccess) return false
      if (pkg?.kind === 'CAMPAIGN' && row?.campaignManage) return false
      if (!q) return true
      return c.name.toLowerCase().includes(q) || String(c.id).includes(q)
    })
  }, [owned, search, inPackageIds, cabinetRows, pkg?.kind])

  useEffect(() => {
    if (open) {
      setTargetPlanId(null)
      setConfirmOpen(false)
      setSearch('')
      setSelectedIds([])
      setPreselectApplied(false)
    }
  }, [open, pkg?.paymentId])

  useEffect(() => {
    if (targets.length > 0 && targetPlanId == null) {
      setTargetPlanId(targets[0].id)
    }
  }, [targets, targetPlanId])

  /** Подстраиваем тир под итоговое число кабинетов (как при покупке). */
  const syncPlanToSelection = (nextSelected: number[]) => {
    const clipped = nextSelected.slice(0, selectLimit)
    setSelectedIds(clipped)
    const needed = used + clipped.length
    const plan = pickPlanForCabinetCount(targets, needed)
    if (plan && plan.id !== targetPlanId) {
      setTargetPlanId(plan.id)
    }
  }

  useEffect(() => {
    if (!open || preselectApplied || selectLimit <= 0) return
    const initial = (preselectedCabinetIds ?? [])
      .filter((id) => !inPackageIds.has(id))
      .slice(0, selectLimit)
    if (initial.length === 0) return
    syncPlanToSelection(initial)
    setPreselectApplied(true)
  }, [open, preselectApplied, selectLimit, preselectedCabinetIds, inPackageIds, targets, used, targetPlanId])

  const payMutation = useMutation({
    mutationFn: () => {
      if (!pkg?.paymentId || targetPlanId == null) throw new Error('Не выбран план')
      return subscriptionApi.initiatePackageUpgrade(pkg.paymentId, targetPlanId, selectedIds)
    },
    onSuccess: (res) => {
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl
        return
      }
      message.error('Не удалось получить ссылку на оплату')
    },
    onError: (e: { response?: { data?: { message?: string } }; message?: string }) => {
      message.error(e.response?.data?.message ?? e.message ?? 'Ошибка оплаты')
    },
  })

  const toggle = (id: number, checked: boolean) => {
    if (checked) {
      if (selectedIds.length >= selectLimit) return
      syncPlanToSelection([...selectedIds, id])
      return
    }
    syncPlanToSelection(selectedIds.filter((x) => x !== id))
  }

  const onSelectTargetPlan = (planId: number) => {
    setTargetPlanId(planId)
    const plan = targets.find((p) => p.id === planId)
    const max = plan?.maxCabinets ?? 1
    const slots = Math.max(0, max - used)
    setSelectedIds((prev) => prev.slice(0, slots))
  }

  const selectedNames = owned
    .filter((c) => selectedIds.includes(c.id))
    .map((c) => c.name)

  return (
    <>
      <Modal
        open={open && !confirmOpen}
        onCancel={onClose}
        footer={null}
        destroyOnClose
        title="Расширить тариф"
        width={560}
      >
        {pkg && (
          <p style={{ color: '#64748B', margin: '0 0 16px' }}>
            {pkg.maxCabinets != null
              ? `Сейчас: до ${pkg.maxCabinets} ${cabinetsWordAfterDo(pkg.maxCabinets)}. Срок действия не изменится.`
              : 'Срок действия не изменится.'}
          </p>
        )}
        {targetsLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : targets.length === 0 ? (
          <div style={{ color: '#94A3B8' }}>Нет доступных тарифов для расширения</div>
        ) : (
          <>
            <Radio.Group
              value={targetPlanId}
              onChange={(e) => onSelectTargetPlan(e.target.value)}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}
            >
              {targets.map((p) => (
                <Radio
                  key={p.id}
                  value={p.id}
                  style={{
                    padding: '10px 12px',
                    border: `1px solid ${targetPlanId === p.id ? accent : border}`,
                    borderRadius: 10,
                    margin: 0,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.35 }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span style={{ color: '#64748B', fontWeight: 400 }}>
                      {formatRub(p.priceRub)} / период
                    </span>
                  </div>
                </Radio>
              ))}
            </Radio.Group>

            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 10,
                background: '#F8FAFC',
                border: `1px solid ${border}`,
                minHeight: 72,
              }}
            >
              {quoteLoading || !quote ? (
                <Spin size="small" />
              ) : (
                <>
                  <div style={{ fontSize: 13, color: '#64748B' }}>
                    Разница тарифов {formatRub(quote.priceDiffRub)} · осталось {quote.remainingDays} из{' '}
                    {quote.periodDays} дн.
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, marginTop: 6 }}>
                    К доплате: {formatRub(quote.amountRub)}
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#0F172A' }}>
                Кабинеты в тарифе ({inPackageCabinets.length})
              </div>
              {cabinetsLoading ? (
                <Spin size="small" />
              ) : (
                <div
                  style={{
                    maxHeight: 140,
                    overflowY: 'auto',
                    border: `1px solid ${border}`,
                    borderRadius: 10,
                    marginBottom: 16,
                  }}
                >
                  {inPackageCabinets.length === 0 ? (
                    <div style={{ padding: 12, color: '#94A3B8' }}>Нет кабинетов в пакете</div>
                  ) : (
                    inPackageCabinets.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                          padding: '10px 12px',
                          borderBottom: `1px solid ${border}`,
                          background: '#F8FAFC',
                        }}
                      >
                        <Checkbox checked disabled />
                        <MarketplaceTypeTag type={c.marketplaceType} size={18} />
                        <span style={{ flex: 1, fontWeight: 500 }}>{c.name}</span>
                        <span style={{ color: '#64748B', fontSize: 12 }}>уже в тарифе</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: '#0F172A' }}>
                Добавить в расширение
              </div>
              <div style={{ color: '#64748B', fontSize: 13, marginBottom: 8 }}>
                В выбранном тарифе свободно {planFreeSlots}
                {absoluteMax > targetMax ? ` (макс. до ${absoluteMax})` : ''}. Выбрано:{' '}
                {selectedIds.length}
                {used + selectedIds.length > 0
                  ? ` · итого ${used + selectedIds.length}`
                  : ''}
              </div>
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                placeholder="Поиск по кабинетам"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: 8 }}
                disabled={selectLimit <= 0}
              />
              <div
                style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  border: `1px solid ${border}`,
                  borderRadius: 10,
                  opacity: selectLimit <= 0 ? 0.55 : 1,
                }}
              >
                {cabinetsLoading ? (
                  <div style={{ padding: 16, textAlign: 'center' }}><Spin size="small" /></div>
                ) : candidates.length === 0 ? (
                  <div style={{ padding: 16, color: '#94A3B8' }}>Нет подходящих кабинетов</div>
                ) : (
                  candidates.map((c) => {
                    const checked = selectedIds.includes(c.id)
                    const atLimit = !checked && selectedIds.length >= selectLimit
                    return (
                      <label
                        key={c.id}
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                          padding: '10px 12px',
                          borderBottom: `1px solid ${border}`,
                          opacity: atLimit ? 0.45 : 1,
                          cursor: atLimit || selectLimit <= 0 ? 'not-allowed' : 'pointer',
                          margin: 0,
                        }}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={atLimit || selectLimit <= 0}
                          onChange={(e) => toggle(c.id, e.target.checked)}
                        />
                        <MarketplaceTypeTag type={c.marketplaceType} size={18} />
                        <span style={{ flex: 1, fontWeight: 500 }}>{c.name}</span>
                        <span style={{ color: '#64748B' }}>{c.id}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <Button onClick={onClose}>Отмена</Button>
              <Button
                type="primary"
                style={{ background: accent, borderColor: accent, fontWeight: 600 }}
                disabled={!quote || quote.amountRub <= 0}
                onClick={() => setConfirmOpen(true)}
              >
                Перейти к оплате →
              </Button>
            </div>
          </>
        )}
      </Modal>

      <PurchaseConfirmModal
        open={confirmOpen && !!quote && !!selectedTarget}
        title={selectedTarget?.name ?? 'Расширение тарифа'}
        details={
          quote
            ? [
                {
                  label: 'Лимит кабинетов',
                  value: `до ${quote.targetMaxCabinets} ${cabinetsWordAfterDo(quote.targetMaxCabinets)}`,
                },
                {
                  label: 'Уже в тарифе',
                  value: `${used} ${cabinetsWord(used)}`,
                },
                {
                  label: 'Добавляем',
                  value:
                    selectedIds.length === 0
                      ? 'Позже'
                      : selectedNames.length <= 2
                        ? selectedNames.join(', ')
                        : `${selectedIds.length} ${cabinetsWord(selectedIds.length)}`,
                },
                { label: 'Срок', value: 'Не изменится' },
                {
                  label: 'Доплата',
                  value: `${formatRub(quote.amountRub)} (осталось ${quote.remainingDays} из ${quote.periodDays} дн.)`,
                },
              ]
            : []
        }
        amountRub={quote?.amountRub ?? 0}
        confirmLoading={payMutation.isPending}
        onBack={() => setConfirmOpen(false)}
        onConfirm={() => payMutation.mutate()}
      />
    </>
  )
}
