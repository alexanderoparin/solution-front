import { useMemo, useState } from 'react'
import { Modal, Button, Spin, message } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionApi } from '../../api/subscription'
import type { PlanDto } from '../../types/api'

const accent = '#7C3AED'
const UNIT_PRICE = 490

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

function PackPriceBlock({ plan }: { plan: PlanDto }) {
  const credits = plan.creditAmount ?? 0
  if (credits <= 1) {
    return (
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>
        {formatRub(plan.priceRub)}
        <div style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8', marginTop: 4 }}>пакет, без срока</div>
      </div>
    )
  }
  const perTest = Math.round(plan.priceRub / credits)
  const save = UNIT_PRICE * credits - plan.priceRub
  return (
    <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{formatRub(plan.priceRub)}</div>
      <div style={{ fontSize: 12, color: '#64748B' }}>{formatRub(perTest)} за тест · пакет, без срока</div>
      {save > 0 && (
        <div style={{ fontSize: 12, color: '#16A34A' }}>Экономия {formatRub(save)}</div>
      )}
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              {paidPlans.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{packTitle(plan)}</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, flex: 1 }}>
                    {plan.description || FALLBACK_PACK_COPY[plan.code ?? ''] || ''}
                  </div>
                  <PackPriceBlock plan={plan} />
                  <Button
                    type="primary"
                    block
                    style={{ background: accent, borderColor: accent }}
                    loading={payMutation.isPending}
                    onClick={() => setConfirmPlan(plan)}
                  >
                    Выбрать
                  </Button>
                </div>
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
