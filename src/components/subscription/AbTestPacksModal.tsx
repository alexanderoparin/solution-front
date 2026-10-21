import { useMemo, useState, type ReactNode } from 'react'
import { Modal, Button, Spin, message } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionApi } from '../../api/subscription'
import type { PlanDto } from '../../types/api'

const accent = '#7C3AED'
const border = '#E2E8F0'
const hoverBg = '#F5F3FF'

const FALLBACK_PACK_COPY: Record<string, string> = {
  ab_pack_1: 'Для одного А/Б теста',
  ab_pack_5: 'Для регулярного А/Б тестирования и поиска лучшего CTR',
  ab_pack_10: 'Самый выгодный пакет для постоянной работы с АБ тестами и роста конверсии',
}

interface AbTestPacksModalProps {
  open: boolean
  onClose: () => void
  onActivated?: () => void
}

function formatRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽'
}

function packTitle(plan: PlanDto): string {
  const credits = plan.creditAmount ?? 0
  if (credits === 1) return '1 тест'
  if (credits > 1) return `${credits} тестов`
  return plan.name
}

/** Карточка пакета с подсветкой при наведении. */
function PackCard({ children }: { children: ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1.5px solid ${hovered ? accent : border}`,
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: hovered ? hoverBg : '#fff',
        boxShadow: hovered ? '0 4px 14px rgba(124, 58, 237, 0.12)' : 'none',
        transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Блок цены пакета.
 * Основная цена всегда в одной строке по высоте между карточками;
 * под ней — фиксированная зона «за тест / экономия».
 * Экономия = цена_1_теста × число_тестов − цена_пакета.
 */
function PackPriceBlock({ plan, unitPrice }: { plan: PlanDto; unitPrice: number }) {
  const credits = plan.creditAmount ?? 0
  const perTest = credits > 1 ? Math.round(plan.priceRub / credits) : null
  const save = credits > 1 ? unitPrice * credits - plan.priceRub : 0
  return (
    <div style={{ marginTop: 'auto', marginBottom: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', lineHeight: 1.25 }}>
        {formatRub(plan.priceRub)}
      </div>
      <div
        style={{
          minHeight: 36,
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          fontSize: 12,
          lineHeight: 1.35,
        }}
      >
        {perTest != null && <span style={{ color: '#64748B' }}>{formatRub(perTest)} за тест</span>}
        {save > 0 && (
          <span style={{ color: '#16A34A', fontWeight: 600 }}>Экономия {formatRub(save)}</span>
        )}
      </div>
    </div>
  )
}

/**
 * Покупка пакетов А/Б на пользователя (без выбора кабинетов и без срока).
 */
export default function AbTestPacksModal({ open, onClose, onActivated }: AbTestPacksModalProps) {
  const queryClient = useQueryClient()
  const [confirmPlan, setConfirmPlan] = useState<PlanDto | null>(null)

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans', 'AB_PACK'],
    queryFn: () => subscriptionApi.getAbPackPlans(),
    enabled: open,
  })

  const paidPlans = useMemo(
    () => [...plans].filter((p) => (p.priceRub ?? 0) > 0).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [plans],
  )

  /** Цена одного теста — база для расчёта экономии на пакетах. */
  const unitPrice = useMemo(() => {
    const single = paidPlans.find((p) => (p.creditAmount ?? 0) === 1)
    return single?.priceRub ?? 0
  }, [paidPlans])

  const payMutation = useMutation({
    mutationFn: (planId: number) => subscriptionApi.initiatePayment(planId),
    onSuccess: (res) => {
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl
        return
      }
      message.error('Не удалось получить ссылку на оплату')
    },
    onError: () => message.error('Ошибка оплаты'),
  })

  return (
    <>
      <Modal
        open={open && !confirmPlan}
        onCancel={onClose}
        footer={null}
        title="A/B-тесты"
        width={720}
        destroyOnClose
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
        ) : (
          <>
            <p style={{ color: '#64748B', marginBottom: 20 }}>
              Пакеты без срока годности. Квота на ваш аккаунт — можно тратить на любые кабинеты.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.max(paidPlans.length, 1)}, minmax(0, 1fr))`,
                gap: 16,
                alignItems: 'stretch',
              }}
            >
              {paidPlans.map((plan) => (
                <PackCard key={plan.id}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{packTitle(plan)}</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, flex: 1 }}>
                    {plan.description || FALLBACK_PACK_COPY[plan.code ?? ''] || ''}
                  </div>
                  <PackPriceBlock plan={plan} unitPrice={unitPrice} />
                  <Button
                    type="primary"
                    block
                    style={{ background: accent, borderColor: accent }}
                    loading={payMutation.isPending}
                    onClick={() => setConfirmPlan(plan)}
                  >
                    Выбрать
                  </Button>
                </PackCard>
              ))}
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={!!confirmPlan}
        onCancel={() => setConfirmPlan(null)}
        title="Подтверждение покупки"
        okText="Оплатить"
        cancelText="Назад"
        confirmLoading={payMutation.isPending}
        onOk={() => {
          if (!confirmPlan) return
          payMutation.mutate(confirmPlan.id, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['subscriptionOverview'] })
              onActivated?.()
            },
          })
        }}
        okButtonProps={{ style: { background: accent, borderColor: accent } }}
      >
        {confirmPlan && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{packTitle(confirmPlan)}</div>
            <div style={{ color: '#64748B', marginBottom: 12 }}>
              {confirmPlan.creditAmount ?? 0} тестов · без срока · на все кабинеты
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{formatRub(confirmPlan.priceRub)}</div>
          </div>
        )}
      </Modal>
    </>
  )
}
