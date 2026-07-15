import { Modal, Button, Typography } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'

const { Text } = Typography
const accent = '#7C3AED'

interface EmailConfirmedModalProps {
  open: boolean
  onLater: () => void
  onAddCabinet: () => void
}

/**
 * После подтверждения email из письма: предложить добавить кабинет.
 */
export default function EmailConfirmedModal({
  open,
  onLater,
  onAddCabinet,
}: EmailConfirmedModalProps) {
  return (
    <Modal
      open={open}
      centered
      closable={false}
      maskClosable={false}
      keyboard={false}
      onCancel={() => undefined}
      footer={[
        <Button key="later" onClick={onLater}>
          Позже
        </Button>,
        <Button
          key="add"
          type="primary"
          onClick={onAddCabinet}
          style={{ backgroundColor: accent, borderColor: accent }}
        >
          Добавить кабинет
        </Button>,
      ]}
    >
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Email успешно подтверждён</h3>
        <Text type="secondary" style={{ fontSize: 15, lineHeight: 1.55 }}>
          Чтобы начать пользоваться сервисом, добавьте кабинет.
        </Text>
      </div>
    </Modal>
  )
}
