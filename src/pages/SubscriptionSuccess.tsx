import { useEffect, useState } from 'react'
import { Button, Result, Spin } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Header from '../components/Header'
import { subscriptionApi } from '../api/subscription'
import { accessStatusQueryKey } from '../api/user'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'

const POLL_INTERVAL_MS = 2000
const POLL_MAX_ATTEMPTS = 30

export default function SubscriptionSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)
  const paymentIdRaw = searchParams.get('paymentId')
  const paymentId = paymentIdRaw ? parseInt(paymentIdRaw, 10) : NaN

  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

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
          if (data.status === 'success') {
            setExpiresAt(data.expiresAt ?? null)
            setStatus('success')
            void queryClient.invalidateQueries({ queryKey: accessStatusQueryKey(userId ?? undefined) })
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

  const subTitle =
    status === 'success' && expiresAt
      ? `Подписка активна до ${dayjs(expiresAt).format('DD.MM.YYYY HH:mm')}. Спасибо!`
      : status === 'pending'
        ? 'Платёж обрабатывается. Доступ откроется в течение нескольких минут.'
        : status === 'error'
          ? 'Платёж не подтверждён. Если деньги списались — обратитесь в поддержку.'
          : 'Подписка активирована. Спасибо!'

  return (
    <>
      <Header />
      <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
        {status === 'loading' ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#64748B' }}>Проверяем статус оплаты…</div>
          </div>
        ) : (
          <Result
            status={status === 'error' ? 'warning' : 'success'}
            title={status === 'error' ? 'Оплата не подтверждена' : 'Оплата прошла успешно'}
            subTitle={subTitle}
            extra={
              <Button type="primary" onClick={() => navigate('/profile')}>
                В профиль
              </Button>
            }
          />
        )}
      </div>
    </>
  )
}
