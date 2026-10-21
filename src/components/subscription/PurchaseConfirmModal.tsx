import { Button, Modal } from 'antd'
import type { ReactNode } from 'react'

const accent = '#7C3AED'
const border = '#E2E8F0'

export interface PurchaseConfirmDetail {
  label: string
  value: ReactNode
}

interface PurchaseConfirmModalProps {
  open: boolean
  /** Название услуги / тарифа. */
  title: string
  /** Строки деталей (кол-во, срок и т.п.). */
  details: PurchaseConfirmDetail[]
  /** Сумма к оплате в рублях. */
  amountRub: number
  confirmLoading?: boolean
  onBack: () => void
  onConfirm: () => void
}

function formatRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽'
}

/**
 * Единое окно подтверждения перед переходом на страницу оплаты Точки.
 */
export default function PurchaseConfirmModal({
  open,
  title,
  details,
  amountRub,
  confirmLoading,
  onBack,
  onConfirm,
}: PurchaseConfirmModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onBack}
      footer={null}
      destroyOnClose
      title="Подтверждение покупки"
      width={440}
      zIndex={1100}
    >
      <div
        style={{
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: 16,
          background: '#F8FAFC',
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: details.length ? 12 : 0 }}>{title}</div>
        {details.map((d) => (
          <div
            key={d.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 13,
              marginBottom: 6,
              color: '#64748B',
            }}
          >
            <span>{d.label}</span>
            <span style={{ color: '#0F172A', fontWeight: 500, textAlign: 'right' }}>{d.value}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}>Оплата</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          К оплате: <span style={{ color: '#0F172A' }}>{formatRub(amountRub)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button onClick={onBack} disabled={confirmLoading}>
          Назад
        </Button>
        <Button
          type="primary"
          loading={confirmLoading}
          onClick={onConfirm}
          style={{ background: accent, borderColor: accent, fontWeight: 600 }}
        >
          Оплатить
        </Button>
      </div>
    </Modal>
  )
}
