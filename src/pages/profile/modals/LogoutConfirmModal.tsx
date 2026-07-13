import { Modal, Button } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'

interface LogoutConfirmModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function LogoutConfirmModal({ open, onCancel, onConfirm }: LogoutConfirmModalProps) {
  return (
    <Modal
      title="Выход из системы"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Отмена
        </Button>,
        <Button key="logout" type="primary" danger icon={<LogoutOutlined />} onClick={onConfirm}>
          Выйти
        </Button>,
      ]}
    >
      <p style={{ margin: 0, color: '#475569' }}>
        Вы уверены, что хотите выйти из аккаунта?
      </p>
    </Modal>
  )
}
