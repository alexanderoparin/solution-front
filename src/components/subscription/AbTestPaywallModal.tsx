import { Modal, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

const accent = '#7C3AED'

interface AbTestPaywallModalProps {
  open: boolean
  onClose: () => void
  /** Открыть выбор пакетов А/Б (если передан — иначе ведём на /subscription). */
  onChooseServiceTariff?: () => void
}

/**
 * Paywall А/Б — подключить услугу или сразу перейти на PRO.
 */
export default function AbTestPaywallModal({ open, onClose, onChooseServiceTariff }: AbTestPaywallModalProps) {
  const navigate = useNavigate()

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={420} centered title="Подписка">
      <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
        Для использования этого раздела нужно подключить услугу. Есть пробные и платные варианты —
        выберите подходящий в подписке. Или перейдите на PRO — полный доступ ко всем разделам.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button
          type="primary"
          block
          size="large"
          style={{ backgroundColor: accent, borderColor: accent }}
          onClick={() => {
            onClose()
            navigate('/subscription')
          }}
        >
          Перейти на PRO
        </Button>
        <Button
          block
          size="large"
          onClick={() => {
            onClose()
            if (onChooseServiceTariff) {
              onChooseServiceTariff()
            } else {
              navigate('/subscription')
            }
          }}
        >
          Подключить услугу
        </Button>
      </div>
    </Modal>
  )
}
