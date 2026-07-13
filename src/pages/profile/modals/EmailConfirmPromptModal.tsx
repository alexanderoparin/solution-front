import { Modal, Button, Typography, Tooltip } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import type { UserProfileResponse } from '../../../types/api'

dayjs.locale('ru')

const { Text } = Typography
const accent = '#7C3AED'

interface EmailConfirmPromptModalProps {
  open: boolean
  profile: UserProfileResponse
  loading: boolean
  onCancel: () => void
  onSend: () => void
}

export default function EmailConfirmPromptModal({
  open,
  profile,
  loading,
  onCancel,
  onSend,
}: EmailConfirmPromptModalProps) {
  const sentAt = profile.lastEmailConfirmationSentAt
    ? new Date(profile.lastEmailConfirmationSentAt).getTime()
    : 0
  const now = Date.now()
  const cooldownMs = 12 * 60 * 60 * 1000
  const canSendAgain = now - sentAt >= cooldownMs
  const nextAvailableMs = sentAt ? sentAt + cooldownMs - now : 0

  const sendButton = (
    <Button
      type="primary"
      loading={loading}
      disabled={!canSendAgain}
      onClick={onSend}
      style={{
        backgroundColor: canSendAgain ? accent : undefined,
        borderColor: canSendAgain ? accent : undefined,
      }}
    >
      Отправить письмо
    </Button>
  )

  return (
    <Modal
      title="Подтверждение email"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Закрыть
        </Button>,
        !canSendAgain && profile.lastEmailConfirmationSentAt ? (
          <Tooltip
            key="send"
            title={`Письмо отправлено ${dayjs(profile.lastEmailConfirmationSentAt).format('D MMM YYYY, HH:mm')}`}
          >
            <span style={{ display: 'inline-block' }}>{sendButton}</span>
          </Tooltip>
        ) : (
          <span key="send">{sendButton}</span>
        ),
      ]}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <ExclamationCircleOutlined style={{ fontSize: 22, color: '#f59e0b', marginTop: 2 }} />
        <div>
          <Text>
            Адрес <Text strong>{profile.email}</Text> ещё не подтверждён. Отправим письмо со ссылкой для
            подтверждения.
          </Text>
          {!canSendAgain && sentAt > 0 && nextAvailableMs > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Повторная отправка будет доступна через {Math.ceil(nextAvailableMs / (60 * 60 * 1000))} ч
              </Text>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
