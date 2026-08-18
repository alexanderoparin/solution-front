import { useMemo, useState } from 'react'
import { Modal, Button, Spin, message } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionApi } from '../../api/subscription'
import type { PlanDto } from '../../types/api'

const accent = '#7C3AED'
const UNIT_PRICE = 500
const AB_PACK_FREE_CODE = 'ab_pack_free'

const connectedButtonStyle = {
  background: '#F8FAFC',
  borderColor: '#E2E8F0',
  color: '#94A3B8',
} as const

const FALLBACK_PACK_COPY: Record<string, string> = {
  ab_pack_1: 'Для одного А/Б теста',
  ab_pack_5: 'Для регулярного А/Б тестирования и поиска лучшего CTR',
  ab_pack_10: 'Самый выгодный пакет для постоянной работы с АБ тестами и роста конверсии',
}

interface AbTestPacksModalProps {
  open: boolean
  cabinetId: number | null
  /** FREE уже активирован для кабинета */
  freeAlreadyUsed?: boolean
  onClose: () => void
  onActivated?: () => void
}

function formatRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽'
}

function isFreeAbPack(plan: PlanDto): boolean {
  return plan.code === AB_PACK_FREE_CODE || (plan.priceRub ?? 0) <= 0
}

function packTitle(plan: PlanDto): string {
  if (isFreeAbPack(plan)) {
    return plan.name || 'FREE'
  }
  const credits = plan.creditAmount ?? 0
  if (credits === 1) return '1 тест'
  if (credits > 1) return `${credits} тестов`
  return plan.name
}

function packDescription(plan: PlanDto): string {
  return plan.description || FALLBACK_PACK_COPY[plan.code ?? ''] || ''
}

/** Блок цены пакета: для мультипаков — цена / за тест / экономия отдельными строками. */
function PackPriceBlock({ plan }: { plan: PlanDto }) {
  const credits = plan.creditAmount ?? 0

  if (isFreeAbPack(plan)) {
    const testsLabel =
      credits === 1 ? '1 тест' : credits >= 2 && credits <= 4 ? `${credits} теста` : `${credits} тестов`
    return (
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>
        0 ₽ / {testsLabel}
      </div>
    )
  }

  if (credits <= 1) {
    return (
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>
        {formatRub(plan.priceRub)}
      </div>
    )
  }

  const perTest = Math.round(plan.priceRub / credits)
  const save = UNIT_PRICE * credits - plan.priceRub

  return (
    <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', lineHeight: 1.3 }}>
        {formatRub(plan.priceRub)}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: accent, lineHeight: 1.3 }}>
        {formatRub(perTest)} за тест
      </div>
      {save > 0 ? (
        <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.3 }}>
          Экономия {formatRub(save)}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Модалка пакетов А/Б: FREE (ab_pack_free) + платные карточки из каталога.
 */
export default function AbTestPacksModal({
  open,
  cabinetId,
  freeAlreadyUsed = false,
  onClose,
  onActivated,
}: AbTestPacksModalProps) {
  const queryClient = useQueryClient()
  const [busyPlanKey, setBusyPlanKey] = useState<string | null>(null)

  const { data: packs = [], isLoading } = useQuery({
    queryKey: ['abPackPlans'],
    queryFn: () => subscriptionApi.getAbPackPlans(),
    enabled: open,
  })

  const { freePlan, paidPacks } = useMemo(() => {
    const free = packs.find(isFreeAbPack) ?? null
    const paid = packs
      .filter((p) => !isFreeAbPack(p))
      .slice()
      .sort((a, b) => (a.priceRub ?? 0) - (b.priceRub ?? 0) || a.id - b.id)
    return { freePlan: free, paidPacks: paid }
  }, [packs])

  const activateFreeMutation = useMutation({
    mutationFn: () => {
      if (cabinetId == null) {
        return Promise.reject(new Error('Кабинет не выбран'))
      }
      return subscriptionApi.activateAbFreeQuota(cabinetId)
    },
    onSuccess: () => {
      const credits = freePlan?.creditAmount ?? 3
      const testsWord =
        credits % 10 === 1 && credits % 100 !== 11
          ? 'тест'
          : credits % 10 >= 2 && credits % 10 <= 4 && (credits % 100 < 10 || credits % 100 >= 20)
            ? 'теста'
            : 'тестов'
      message.success(
        credits === 1
          ? 'Подключён 1 бесплатный А/Б тест'
          : `Подключены ${credits} бесплатных А/Б ${testsWord}`,
      )
      void queryClient.invalidateQueries({ queryKey: ['cabinetBilling'] })
      onActivated?.()
      onClose()
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { error?: string } } })?.response?.data
      message.error(data?.error || 'Не удалось подключить бесплатные тесты')
    },
    onSettled: () => setBusyPlanKey(null),
  })

  const payMutation = useMutation({
    mutationFn: (planId: number) => {
      if (cabinetId == null) {
        return Promise.reject(new Error('Кабинет не выбран'))
      }
      return subscriptionApi.initiatePayment(planId, cabinetId)
    },
    onSuccess: (data) => {
      window.location.href = data.paymentUrl
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { error?: string } } })?.response?.data
      message.error(data?.error || 'Не удалось перейти к оплате')
    },
    onSettled: () => setBusyPlanKey(null),
  })

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      title="Пакеты А/Б тестов"
      destroyOnClose
    >
      <div
        style={{
          background: '#F5F3FF',
          border: `1px solid ${accent}`,
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 14,
          color: '#1E293B',
          lineHeight: 1.5,
        }}
      >
        Пакеты открывают доступ к созданию А/Б-тестов главного фото. Купленные тесты не сгорают и
        действуют бессрочно.
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {freePlan && (
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 12,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 280,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>
                {packTitle(freePlan)}
              </div>
              <div style={{ fontSize: 13, color: '#475569', flex: 1, marginBottom: 16, lineHeight: 1.45 }}>
                {packDescription(freePlan)}
              </div>
              <PackPriceBlock plan={freePlan} />
              <Button
                type={freeAlreadyUsed ? 'default' : 'primary'}
                block
                disabled={freeAlreadyUsed || cabinetId == null}
                title={freeAlreadyUsed ? 'Бесплатные тесты уже подключены' : undefined}
                loading={!freeAlreadyUsed && busyPlanKey === 'free'}
                onClick={
                  freeAlreadyUsed
                    ? undefined
                    : () => {
                        setBusyPlanKey('free')
                        activateFreeMutation.mutate()
                      }
                }
                style={freeAlreadyUsed ? connectedButtonStyle : { backgroundColor: accent, borderColor: accent }}
              >
                {freeAlreadyUsed ? 'Подключено' : 'Подключить'}
              </Button>
            </div>
          )}

          {paidPacks.map((plan) => {
            const key = plan.code ?? String(plan.id)
            return (
              <div
                key={plan.id}
                style={{
                  background: '#F8FAFC',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 280,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>
                  {packTitle(plan)}
                </div>
                <div style={{ fontSize: 13, color: '#475569', flex: 1, marginBottom: 16, lineHeight: 1.45 }}>
                  {packDescription(plan)}
                </div>
                <PackPriceBlock plan={plan} />
                <Button
                  type="primary"
                  block
                  disabled={cabinetId == null}
                  loading={busyPlanKey === key}
                  onClick={() => {
                    setBusyPlanKey(key)
                    payMutation.mutate(plan.id)
                  }}
                  style={{ backgroundColor: accent, borderColor: accent }}
                >
                  Подключить
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
