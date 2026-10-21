import { useEffect, useState } from 'react'
import { Button, Modal, Spin } from 'antd'
import { CheckCircleFilled, CloseCircleFilled, ClockCircleFilled } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { subscriptionApi } from '../api/subscription'
import { accessStatusQueryKey } from '../api/user'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'

const POLL_INTERVAL_MS = 2000
const POLL_MAX_ATTEMPTS = 30
const accent = '#7C3AED'

type UiStatus = 'loading' | 'success' | 'pending' | 'error'

/**
 * Возврат с Точки после оплаты: polling статуса и модалка поверх затемнённого фона.
 */
export default function SubscriptionSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)
  const paymentIdRaw = searchParams.get('paymentId')
  const paymentId = paymentIdRaw ? parseInt(paymentIdRaw, 10) : NaN

  const [status, setStatus] = useState<UiStatus>('loading')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [planName, setPlanName] = useState<string | null>(null)
  const [planCode, setPlanCode] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(paymentId)) {
      setStatus('success')
      return
    }

    let cancelled = false
    let attempts = 0

    const poll = async () => {
      while (!cancelled && attempts < POLL_MAX_ATTEMPTS) {
        attempts += 1
        try {
          const data = await subscriptionApi.getPaymentStatus(paymentId)
          if (data.planName) setPlanName(data.planName)
          if (data.planCode) setPlanCode(data.planCode)
          if (data.status === 'success') {
            setExpiresAt(data.expiresAt ?? null)
            setStatus('success')
            void queryClient.invalidateQueries({ queryKey: accessStatusQueryKey(userId ?? undefined) })
            void queryClient.invalidateQueries({ queryKey: ['subscriptionOverview'] })
            void queryClient.invalidateQueries({ queryKey: ['userPayments'] })
            return
          }
          if (data.status === 'failed') {
            setStatus('error')
            return
          }
        } catch {
          /* повторим polling */
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }
      if (!cancelled) {
        setStatus('pending')
      }
    }

    void poll()
    return () => {
      cancelled = true
    }
  }, [paymentId, queryClient, userId])

  const isAbPack = (planCode ?? '').toLowerCase().startsWith('ab_pack')

  const successBody = (() => {
    const name = planName ?? 'услуга'
    if (isAbPack) {
      return `Покупка успешно выполнена! Услуга «${name}» подключена к вашему аккаунту.`
    }
    if (expiresAt) {
      return `Покупка успешно выполнена! «${name}» активна до ${dayjs(expiresAt).format('DD.MM.YYYY')}.`
    }
    return `Покупка успешно выполнена! Услуга «${name}» подключена.`
  })()

  const goCabinets = () => navigate('/profile')
  const goSubscription = () => navigate('/subscription')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Modal
        open
        closable={status !== 'loading'}
        onCancel={status === 'success' || status === 'pending' ? goCabinets : goSubscription}
        footer={null}
        centered
        width={420}
        mask={false}
        styles={{ body: { paddingTop: 8 } }}
      >
        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '24px 8px 16px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#64748B' }}>Проверяем статус оплаты…</div>
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '8px 4px 4px' }}>
            <CheckCircleFilled style={{ fontSize: 56, color: '#22C55E' }} />
            <div style={{ fontWeight: 700, fontSize: 18, marginTop: 16, color: '#0F172A' }}>
              Оплата успешно выполнена
            </div>
            <div style={{ color: '#64748B', marginTop: 10, lineHeight: 1.5, fontSize: 14 }}>
              {successBody}
            </div>
            <Button
              type="primary"
              block
              size="large"
              onClick={goCabinets}
              style={{
                marginTop: 24,
                background: accent,
                borderColor: accent,
                fontWeight: 600,
                height: 44,
              }}
            >
              Перейти к кабинетам
            </Button>
          </div>
        )}

        {status === 'pending' && (
          <div style={{ textAlign: 'center', padding: '8px 4px 4px' }}>
            <ClockCircleFilled style={{ fontSize: 56, color: '#F59E0B' }} />
            <div style={{ fontWeight: 700, fontSize: 18, marginTop: 16, color: '#0F172A' }}>
              Платёж обрабатывается
            </div>
            <div style={{ color: '#64748B', marginTop: 10, lineHeight: 1.5, fontSize: 14 }}>
              Доступ откроется в течение нескольких минут. Обновите страницу подписки чуть позже.
            </div>
            <Button
              type="primary"
              block
              size="large"
              onClick={goSubscription}
              style={{
                marginTop: 24,
                background: accent,
                borderColor: accent,
                fontWeight: 600,
                height: 44,
              }}
            >
              К подписке
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '8px 4px 4px' }}>
            <CloseCircleFilled style={{ fontSize: 56, color: '#EF4444' }} />
            <div style={{ fontWeight: 700, fontSize: 18, marginTop: 16, color: '#0F172A' }}>
              Оплата не подтверждена
            </div>
            <div style={{ color: '#64748B', marginTop: 10, lineHeight: 1.5, fontSize: 14 }}>
              Платёж не подтверждён. Если деньги списались — обратитесь в поддержку.
            </div>
            <Button
              type="primary"
              block
              size="large"
              onClick={goSubscription}
              style={{
                marginTop: 24,
                background: accent,
                borderColor: accent,
                fontWeight: 600,
                height: 44,
              }}
            >
              К подписке
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
