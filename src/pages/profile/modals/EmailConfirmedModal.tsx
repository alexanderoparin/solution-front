import { Modal, Button } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'

const accent = '#7C3AED'

interface EmailConfirmedModalProps {
  open: boolean
  onClose: () => void
}

export default function EmailConfirmedModal({ open, onClose }: EmailConfirmedModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key="ok"
          type="primary"
          onClick={onClose}
          style={{ backgroundColor: accent, borderColor: accent }}
        >
          Отлично
        </Button>,
      ]}
      centered
    >
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Email подтверждён</h3>
        <p style={{ margin: 0, color: '#64748B' }}>
          Ваш адрес электронной почты успешно подтверждён.
        </p>
      </div>
    </Modal>
  )
}
