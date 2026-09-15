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
      <div className="ab-pack-price" style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>
        0 ₽ / {testsLabel}
      </div>
    )
  }

  if (credits <= 1) {
    return (
      <div className="ab-pack-price" style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>
        {formatRub(plan.priceRub)}
      </div>
    )
  }

  const perTest = Math.round(plan.priceRub / credits)
  const save = UNIT_PRICE * credits - plan.priceRub

  return (
    <div className="ab-pack-price" style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="ab-pack-price-main" style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', lineHeight: 1.3 }}>
        {formatRub(plan.priceRub)}
      </div>
      <div className="ab-pack-price-unit" style={{ fontSize: 14, fontWeight: 600, color: accent, lineHeight: 1.3 }}>
        {formatRub(perTest)} за тест
      </div>
      {save > 0 ? (
        <div className="ab-pack-price-save" style={{ fontSize: 14, color: '#64748B', lineHeight: 1.3 }}>
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
      centered
      className="ab-test-packs-modal"
      styles={{ content: { padding: 20 } }}
    >
      <style>{`
        @media (max-width: 900px) {
          .ab-test-packs-modal {
            max-width: calc(100vw - 16px) !important;
            top: 0;
            padding-bottom: 0;
            margin: 0 auto;
          }
          .ab-test-packs-modal .ant-modal-content {
            padding: 12px 12px 14px !important;
          }
          .ab-test-packs-modal .ant-modal-header {
            margin-bottom: 8px;
          }
          .ab-test-packs-modal .ant-modal-title {
            font-size: 16px;
            line-height: 1.3;
          }
          .ab-pack-intro {
            padding: 8px 10px !important;
            margin-bottom: 10px !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            border-radius: 8px !important;
          }
          .ab-pack-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .ab-pack-card {
            min-height: 0 !important;
            padding: 10px 12px !important;
            border-radius: 10px !important;
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) auto;
            grid-template-areas:
              "title price"
              "desc desc"
              "btn btn";
            column-gap: 10px;
            row-gap: 4px;
            align-items: start;
          }
          .ab-pack-title {
            grid-area: title;
            font-size: 15px !important;
            margin-bottom: 0 !important;
          }
          .ab-pack-desc {
            grid-area: desc;
            font-size: 12px !important;
            margin-bottom: 2px !important;
            flex: none !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .ab-pack-price {
            grid-area: price;
            margin-bottom: 0 !important;
            text-align: right;
            font-size: 13px !important;
            flex-direction: column !important;
            gap: 0 !important;
            justify-self: end;
          }
          .ab-pack-price-main {
            font-size: 14px !important;
          }
          .ab-pack-price-unit,
          .ab-pack-price-save {
            font-size: 11px !important;
          }
          .ab-pack-btn {
            grid-area: btn;
            margin-top: 4px;
          }
        }
      `}</style>
      <div
        className="ab-pack-intro"
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
          className="ab-pack-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {freePlan && (
            <div
              className="ab-pack-card"
              style={{
                background: '#F8FAFC',
                borderRadius: 12,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 280,
              }}
            >
              <div className="ab-pack-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>
                {packTitle(freePlan)}
              </div>
              <div className="ab-pack-desc" style={{ fontSize: 13, color: '#475569', flex: 1, marginBottom: 16, lineHeight: 1.45 }}>
                {packDescription(freePlan)}
              </div>
              <PackPriceBlock plan={freePlan} />
              <Button
                className="ab-pack-btn"
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
                className="ab-pack-card"
                style={{
                  background: '#F8FAFC',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 280,
                }}
              >
                <div className="ab-pack-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>
                  {packTitle(plan)}
                </div>
                <div className="ab-pack-desc" style={{ fontSize: 13, color: '#475569', flex: 1, marginBottom: 16, lineHeight: 1.45 }}>
                  {packDescription(plan)}
                </div>
                <PackPriceBlock plan={plan} />
                <Button
                  className="ab-pack-btn"
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
