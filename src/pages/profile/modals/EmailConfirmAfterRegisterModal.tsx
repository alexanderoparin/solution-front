import { Modal, Button, Typography } from 'antd'
import { MailOutlined } from '@ant-design/icons'

const { Text } = Typography
const accent = '#7C3AED'

interface EmailConfirmAfterRegisterModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Попап сразу после регистрации: напоминание подтвердить почту.
 * Закрывается только по кнопке «Принято».
 */
export default function EmailConfirmAfterRegisterModal({
  open,
  onClose,
}: EmailConfirmAfterRegisterModalProps) {
  return (
    <Modal
      open={open}
      centered
      closable={false}
      maskClosable={false}
      keyboard={false}
      onCancel={() => undefined}
      footer={[
        <Button
          key="ok"
          type="primary"
          onClick={onClose}
          style={{ backgroundColor: accent, borderColor: accent }}
        >
          Принято
        </Button>,
      ]}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0 4px' }}>
        <MailOutlined style={{ fontSize: 22, color: accent, marginTop: 2 }} />
        <div>
          <Text style={{ fontSize: 15, lineHeight: 1.55 }}>
            Для начала работы, подтвердите указанную почту.
            <br />
            Письма могут уходить в папку «Рассылки».
          </Text>
        </div>
      </div>
    </Modal>
  )
}
