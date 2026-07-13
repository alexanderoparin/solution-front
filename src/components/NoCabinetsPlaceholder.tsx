import { useState } from 'react'
import { Button, Form, Input, Modal, Select, Typography, message } from 'antd'
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cabinetsApi } from '../api/cabinets'
import type { CabinetTokenType } from '../types/api'
import { getRequestFailureDescription } from '../utils/requestError'

const { Text, Title } = Typography

const WB_TOKEN_CHECK_URL =
  'https://dev.wildberries.ru/jwt?utm_source=dev-portal&utm_campaign=api-information&utm_content=cta-link'

const wbTokenCheckLink = (
  <a
    href={WB_TOKEN_CHECK_URL}
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: '#7C3AED', fontSize: 12 }}
  >
    Проверить токен и доступ к категориям методов API
  </a>
)

interface NoCabinetsPlaceholderProps {
  onCreated?: () => void
  /** empty — полный блок; button — только кнопка «Добавить кабинет». */
  variant?: 'empty' | 'button'
}

export default function NoCabinetsPlaceholder({ onCreated, variant = 'empty' }: NoCabinetsPlaceholderProps) {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<{ name?: string; apiKey: string; tokenType: CabinetTokenType }>()

  const createMutation = useMutation({
    mutationFn: cabinetsApi.create,
    onSuccess: () => {
      message.success('Кабинет создан')
      setModalOpen(false)
      form.resetFields()
      void queryClient.invalidateQueries({ queryKey: ['cabinetsOverview'] })
      void queryClient.invalidateQueries({ queryKey: ['cabinets'] })
      onCreated?.()
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
  })

  return (
    <>
      {variant === 'empty' ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            border: '1px dashed #E2E8F0',
            borderRadius: 12,
            background: '#FAFAFA',
          }}
        >
          <AppstoreOutlined style={{ fontSize: 48, color: '#CBD5E1', marginBottom: 16 }} />
          <Title level={4} style={{ marginBottom: 8 }}>
            Нет кабинетов
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>
            Добавьте первый кабинет Wildberries, чтобы начать работу с аналитикой и рекламой.
          </Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
          >
            Добавить кабинет
          </Button>
        </div>
      ) : (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
          style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
        >
          Добавить кабинет
        </Button>
      )}

      <Modal
        title="Новый кабинет"
        open={modalOpen}
        destroyOnClose
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setModalOpen(false)
              form.resetFields()
            }}
          >
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={createMutation.isPending}
            style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
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
            createMutation.mutate({ apiKey, tokenType, name })
          }}
        >
          <Form.Item
            name="apiKey"
            label="WB API-токен"
            extra={wbTokenCheckLink}
            rules={[{ required: true, whitespace: true, message: 'Введите API-токен WB' }]}
          >
            <Input.Password placeholder="Введите токен" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="tokenType"
            label="Тип токена WB"
            rules={[{ required: true, message: 'Выберите тип токена' }]}
          >
            <Select
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
      </Modal>
    </>
  )
}
