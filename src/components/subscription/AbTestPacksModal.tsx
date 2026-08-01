import { useState } from 'react'
import { Modal, Button, Spin, message } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionApi } from '../../api/subscription'
import type { PlanDto } from '../../types/api'

const accent = '#7C3AED'
const UNIT_PRICE = 500

const FREE_COPY = '3 бесплатных А/Б теста для знакомства с возможностями сервиса'

const PACK_COPY: Record<string, string> = {
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
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' руб'
}

function packTitle(plan: PlanDto): string {
  const credits = plan.creditAmount ?? 0
  if (credits === 1) return '1 тест'
  if (credits > 1) return `${credits} тестов`
  return plan.name
}

function packPriceLabel(plan: PlanDto): string {
  const credits = plan.creditAmount ?? 0
  const price = formatRub(plan.priceRub)
  if (credits <= 1) return price
  const perTest = Math.round(plan.priceRub / credits)
  const save = UNIT_PRICE * credits - plan.priceRub
  const savePart = save > 0 ? ` · экономия ${formatRub(save)}` : ''
  return `${price} (${perTest} руб/тест${savePart})`
}

/**
 * Модалка пакетов А/Б в стиле «Подписка на Управление РК»: FREE + платные карточки с «Подключить».
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

  const activateFreeMutation = useMutation({
    mutationFn: () => {
      if (cabinetId == null) {
        return Promise.reject(new Error('Кабинет не выбран'))
      }
      return subscriptionApi.activateAbFreeQuota(cabinetId)
    },
    onSuccess: () => {
      message.success('Подключены 3 бесплатных А/Б теста')
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
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>FREE</div>
            <div style={{ fontSize: 13, color: '#475569', flex: 1, marginBottom: 16, lineHeight: 1.45 }}>
              {FREE_COPY}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#1E293B' }}>
              0 руб / 3 теста
            </div>
            <Button
              type="primary"
              block
              disabled={freeAlreadyUsed || cabinetId == null}
              title={freeAlreadyUsed ? 'Бесплатные тесты уже были подключены' : undefined}
              loading={busyPlanKey === 'free'}
              onClick={() => {
                setBusyPlanKey('free')
                activateFreeMutation.mutate()
              }}
              style={{ backgroundColor: accent, borderColor: accent }}
            >
              Подключить
            </Button>
          </div>

          {packs.map((plan) => {
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
                  {PACK_COPY[plan.code ?? ''] || plan.description}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#1E293B' }}>
                  {packPriceLabel(plan)}
                </div>
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
