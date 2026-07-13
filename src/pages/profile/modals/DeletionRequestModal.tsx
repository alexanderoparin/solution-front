import { Modal, Form, Select, Input, Button } from 'antd'
import type { AccountDeletionReason, CreateDeletionRequestRequest } from '../../../types/api'

const accent = '#7C3AED'

const DELETION_REASON_OPTIONS: { value: AccountDeletionReason; label: string }[] = [
  { value: 'NOT_USING', label: 'Не пользуюсь сервисом' },
  { value: 'OTHER_SERVICE', label: 'Перехожу на другой сервис' },
  { value: 'FUNCTIONALITY', label: 'Не хватает функционала' },
  { value: 'TOO_EXPENSIVE', label: 'Слишком дорого' },
  { value: 'OTHER', label: 'Другое' },
]

interface DeletionRequestModalProps {
  open: boolean
  loading: boolean
  onCancel: () => void
  onSubmit: (values: CreateDeletionRequestRequest) => void
}

export default function DeletionRequestModal({
  open,
  loading,
  onCancel,
  onSubmit,
}: DeletionRequestModalProps) {
  const [form] = Form.useForm<CreateDeletionRequestRequest>()

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="Удаление аккаунта"
      open={open}
      destroyOnClose
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Отмена
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger
          loading={loading}
          onClick={() => form.submit()}
        >
          Отправить заявку
        </Button>,
      ]}
    >
      <p style={{ color: '#475569', marginBottom: 16 }}>
        После обработки заявки ваш аккаунт и все связанные данные будут удалены. Это действие необратимо.
      </p>
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        onFinish={(values) => {
          onSubmit({
            reason: values.reason,
            comment: values.comment?.trim() || undefined,
          })
        }}
      >
        <Form.Item
          name="reason"
          label="Причина удаления"
          rules={[{ required: true, message: 'Выберите причину' }]}
        >
          <Select placeholder="Выберите причину" options={DELETION_REASON_OPTIONS} />
        </Form.Item>

        <Form.Item name="comment" label="Комментарий">
          <Input.TextArea
            rows={3}
            placeholder="Дополнительные детали (необязательно)"
            maxLength={1000}
            showCount
          />
        </Form.Item>
      </Form>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 0 }}>
        Если заявка отправлена по ошибке, напишите в поддержку:{' '}
        <a href="mailto:corp@click-i.ru" style={{ color: accent }}>
          corp@click-i.ru
        </a>
      </p>
    </Modal>
  )
}
