import { useState } from 'react'
import { Modal, Form, Input, Select, Button, Typography } from 'antd'
import { KeyOutlined } from '@ant-design/icons'
import type { CabinetTokenType, CreateCabinetRequest } from '../../../types/api'
import TokenCreationGuideModal from './TokenCreationGuideModal'

const { Text } = Typography
const accent = '#7C3AED'

const WB_TOKEN_HINT =
  'Для работы с сервисом, необходимо выбрать следующие категории «Контент, Цены и скидки, Продвижение, Аналитика, Статистика, Маркетплейс. Уровень доступа к данным: Чтение и запись»'

const WB_TOKEN_TYPE_HINT = 'Важно указать правильный тип токена — от этого зависит корректная работа сервиса.'

interface AddCabinetModalProps {
  open: boolean
  loading: boolean
  onCancel: () => void
  onSubmit: (values: CreateCabinetRequest) => void
}

export default function AddCabinetModal({ open, loading, onCancel, onSubmit }: AddCabinetModalProps) {
  const [form] = Form.useForm<{ name?: string; apiKey: string; tokenType?: CabinetTokenType }>()
  const [guideOpen, setGuideOpen] = useState(false)

  const handleCancel = () => {
    setGuideOpen(false)
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="Новый кабинет"
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
          loading={loading}
          style={{ backgroundColor: accent, borderColor: accent }}
          onClick={() => form.submit()}
        >
          Создать
        </Button>,
      ]}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Укажите API-токен WB и его тип. Если не ввести название кабинета, оно подставится из ответа WB.
      </Text>
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        onFinish={({ apiKey, tokenType, name }) => {
          if (!tokenType) {
            return
          }
          const body: CreateCabinetRequest = {
            tokenType,
            apiKey: apiKey.trim(),
          }
          const trimmedName = name?.trim()
          if (trimmedName) {
            body.name = trimmedName
          }
          onSubmit(body)
        }}
      >
        <Form.Item
          name="apiKey"
          label="WB API-токен"
          extra={(
            <div>
              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                {WB_TOKEN_HINT}
              </Text>
              <Button
                type="link"
                size="small"
                onClick={() => setGuideOpen(true)}
                style={{ height: 'auto', padding: '4px 0 0', fontSize: 12 }}
              >
                Как создать токен
              </Button>
            </div>
          )}
          rules={[{ required: true, whitespace: true, message: 'Введите API-токен WB' }]}
        >
          <Input.Password prefix={<KeyOutlined />} placeholder="Введите токен" autoComplete="off" />
        </Form.Item>

        <Form.Item
          name="tokenType"
          label="Тип токена WB"
          extra={<Text type="secondary" style={{ fontSize: 12 }}>{WB_TOKEN_TYPE_HINT}</Text>}
          rules={[{ required: true, message: 'Выберите тип токена' }]}
        >
          <Select
            allowClear
            placeholder="Выберите тип токена"
            options={[
              { value: 'BASIC', label: 'Базовый' },
              { value: 'PERSONAL', label: 'Персональный' },
            ]}
          />
        </Form.Item>

        <Form.Item name="name" label="Название кабинета">
          <Input placeholder="Необязательно — подставится из WB" />
        </Form.Item>
      </Form>
      <TokenCreationGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </Modal>
  )
}
