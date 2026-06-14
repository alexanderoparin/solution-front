import { useState } from 'react'
import { Modal, Input, Button, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PAYMENT_UNAVAILABLE_PATH } from '../../constants/subscriptionRoutes'
import type { PlanDto } from '../../types/api'
import { subscriptionApi } from '../../api/subscription'
import { accessStatusQueryKey } from '../../api/user'
import { useAuthStore } from '../../store/authStore'
import { useCampaignManageAccess } from '../../hooks/useCampaignManageAccess'

const accent = '#7C3AED'

interface CampaignManageCheckoutModalProps {
  open: boolean
  plan: PlanDto | null
  onBack: () => void
  onClose: () => void
}

function formatPrice(rub: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(rub) + ' ₽'
}

function previewExpiresAt(plan: PlanDto, currentExpires: string | null | undefined): string {
  const base =
    currentExpires && dayjs(currentExpires).isAfter(dayjs()) ? dayjs(currentExpires) : dayjs()
  if (plan.periodType === 'CALENDAR_MONTH') {
    return base.add(1, 'month').format('DD.MM.YYYY')
  }
  return base.add(plan.periodDays, 'day').format('DD.MM.YYYY')
}

export default function CampaignManageCheckoutModal({
  open,
  plan,
  onBack,
  onClose,
}: CampaignManageCheckoutModalProps) {
  const navigate = useNavigate()
  const email = useAuthStore((s) => s.email)
  const queryClient = useQueryClient()
  const { campaignManage, sellerId } = useCampaignManageAccess()
  const [promo, setPromo] = useState('')

  const isFree = plan != null && plan.priceRub <= 0

  const activateMutation = useMutation({
    mutationFn: (planId: number) => subscriptionApi.activatePlan(planId),
    onSuccess: () => {
      message.success('Подписка активирована')
      void queryClient.invalidateQueries({ queryKey: accessStatusQueryKey(sellerId) })
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      message.error(msg || 'Не удалось активировать план')
    },
  })

  if (!plan) return null

  const busy = activateMutation.isPending
  const validUntil = previewExpiresAt(plan, campaignManage?.expiresAt)

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={440}
      destroyOnClose
      title={null}
      closable={false}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} disabled={busy} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#1E293B' }}>Тариф {plan.name}</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>Оплата доступа к разделу «Управление РК»</div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #E2E8F0' }}>
        <Row label="Стоимость" value={formatPrice(plan.priceRub)} />
        <Row label="Срок действия до" value={validUntil} />
        <Row label="Почта" value={email || '—'} />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 0',
          borderTop: '1px solid #E2E8F0',
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        <span>Итого</span>
        <span>{formatPrice(plan.priceRub)}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Input
          placeholder="Введите промокод"
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          disabled
        />
        <Button disabled title="Скоро">Применить</Button>
      </div>

      <Button
        type="primary"
        block
        size="large"
        loading={busy}
        onClick={() => {
          if (isFree) {
            activateMutation.mutate(plan.id)
          } else {
            onClose()
            navigate(PAYMENT_UNAVAILABLE_PATH)
          }
        }}
        style={{ backgroundColor: accent, borderColor: accent, height: 48 }}
      >
        {isFree ? 'Попробовать' : 'Оплатить'}
      </Button>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid #E2E8F0',
        fontSize: 14,
      }}
    >
      <span style={{ color: '#64748B' }}>{label}</span>
      <span style={{ color: '#1E293B', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
