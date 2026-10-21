import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Modal, Spin, message } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { cabinetsApi } from '../../api/cabinets'
import { subscriptionApi } from '../../api/subscription'
import type { UserBillingActivePackageDto, UserBillingCabinetRowDto } from '../../types/api'
import MarketplaceTypeTag from '../MarketplaceTypeTag'
import PurchaseConfirmModal from './PurchaseConfirmModal'

const accent = '#7C3AED'
const border = '#E2E8F0'

interface UpgradeToProModalProps {
  open: boolean
  pkg: UserBillingActivePackageDto | null
  cabinetRows: UserBillingCabinetRowDto[]
  onClose: () => void
}

function formatRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽'
}

function cabinetsWord(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'кабинетов'
  if (mod10 === 1) return 'кабинет'
  if (mod10 >= 2 && mod10 <= 4) return 'кабинета'
  return 'кабинетов'
}

/**
 * Улучшение пакета «Управление РК» до парного PRO с prorate-доплатой.
 */
export default function UpgradeToProModal({
  open,
  pkg,
  cabinetRows: _cabinetRows,
  onClose,
}: UpgradeToProModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: quote, isLoading: quoteLoading, isError: quoteError } = useQuery({
    queryKey: ['upgradeToProQuote', pkg?.paymentId],
    queryFn: () => subscriptionApi.getUpgradeToProQuote(pkg!.paymentId!),
    enabled: open && !!pkg?.paymentId,
  })

  const { data: overview, isLoading: cabinetsLoading } = useQuery({
    queryKey: ['cabinetsOverview'],
    queryFn: () => cabinetsApi.getOverview(),
    enabled: open,
  })

  const inPackageIds = useMemo(() => new Set(pkg?.cabinetIds ?? []), [pkg])
  const inPackageCabinets = useMemo(
    () => (overview?.owned ?? []).filter((c) => inPackageIds.has(c.id)),
    [overview, inPackageIds],
  )

  useEffect(() => {
    if (open) {
      setConfirmOpen(false)
    }
  }, [open, pkg?.paymentId])

  const payMutation = useMutation({
    mutationFn: () => {
      if (!pkg?.paymentId) throw new Error('Нет paymentId')
      return subscriptionApi.initiateUpgradeToPro(pkg.paymentId)
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

  const used = pkg?.cabinetCount ?? inPackageIds.size

  return (
    <>
      <Modal
        open={open && !confirmOpen}
        onCancel={onClose}
        footer={null}
        destroyOnClose
        title="Улучшить до PRO"
        width={520}
      >
        <p style={{ color: '#64748B', margin: '0 0 16px' }}>
          Полный доступ на те же кабинеты. Срок действия не изменится. Обратно к «Управление РК»
          вернуться нельзя.
        </p>

        {quoteLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : quoteError || !quote ? (
          <div style={{ color: '#94A3B8' }}>Не удалось рассчитать доплату</div>
        ) : (
          <>
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                border: `1px solid ${border}`,
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Сейчас</div>
              <div style={{ fontWeight: 600 }}>{pkg?.title ?? quote.currentPlanCode}</div>
              <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
                {formatRub(quote.currentPriceRub)} / период
              </div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 10,
                border: `1px solid ${accent}`,
                background: '#F5F3FF',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, color: '#7C3AED', marginBottom: 4 }}>Станет</div>
              <div style={{ fontWeight: 700 }}>{quote.targetPlanName}</div>
              <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
                {formatRub(quote.targetPriceRub)} / период
              </div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: '#F8FAFC',
                border: `1px solid ${border}`,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, color: '#64748B' }}>
                Разница тарифов {formatRub(quote.priceDiffRub)} · осталось {quote.remainingDays} из{' '}
                {quote.periodDays} дн.
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, marginTop: 6 }}>
                К доплате: {formatRub(quote.amountRub)}
              </div>
            </div>

            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#0F172A' }}>
              Кабинеты в тарифе ({inPackageCabinets.length || used})
            </div>
            <div
              style={{
                maxHeight: 160,
                overflowY: 'auto',
                border: `1px solid ${border}`,
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              {cabinetsLoading ? (
                <div style={{ padding: 16, textAlign: 'center' }}><Spin size="small" /></div>
              ) : inPackageCabinets.length === 0 ? (
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
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button onClick={onClose}>Отмена</Button>
              <Button
                type="primary"
                style={{ background: accent, borderColor: accent, fontWeight: 600 }}
                disabled={quote.amountRub <= 0}
                onClick={() => setConfirmOpen(true)}
              >
                Перейти к оплате →
              </Button>
            </div>
          </>
        )}
      </Modal>

      <PurchaseConfirmModal
        open={confirmOpen && !!quote}
        title={quote?.targetPlanName ?? 'Полный доступ'}
        details={
          quote
            ? [
                { label: 'Было', value: pkg?.title ?? quote.currentPlanCode },
                { label: 'Кабинеты', value: `${used} ${cabinetsWord(used)}` },
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
