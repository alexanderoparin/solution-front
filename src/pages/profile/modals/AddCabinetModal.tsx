import { useState } from 'react'
import { Modal, Form, Input, Select, Button, Typography, Space } from 'antd'
import { KeyOutlined } from '@ant-design/icons'
import type { CabinetTokenType, CreateCabinetRequest, MarketplaceType } from '../../../types/api'
import TokenCreationGuideModal from './TokenCreationGuideModal'
import MarketplaceTypeTag from '../../../components/MarketplaceTypeTag'

const { Text } = Typography
const accent = '#7C3AED'

const WB_TOKEN_HINT =
  'Для работы с сервисом, необходимо выбрать следующие категории «Контент, Цены и скидки, Продвижение, Аналитика, Статистика, Маркетплейс. Уровень доступа к данным: Чтение и запись»'

const WB_TOKEN_TYPE_HINT = 'Важно указать правильный тип токена — от этого зависит корректная работа сервиса.'

const OZON_HINT =
  'Укажите Client-Id и Api-Key из личного кабинета Ozon (Seller API). После создания кабинета можно запустить синхронизацию каталога.'

interface AddCabinetModalProps {
  open: boolean
  loading: boolean
  onCancel: () => void
  onSubmit: (values: CreateCabinetRequest) => void
}

type FormValues = {
  marketplaceType: MarketplaceType
  name?: string
  apiKey?: string
  tokenType?: CabinetTokenType
  ozonClientId?: string
}

export default function AddCabinetModal({ open, loading, onCancel, onSubmit }: AddCabinetModalProps) {
  const [form] = Form.useForm<FormValues>()
  const [guideOpen, setGuideOpen] = useState(false)
  const marketplaceType = Form.useWatch('marketplaceType', form) ?? 'WB'
  const isOzon = marketplaceType === 'OZON'

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
        {isOzon
          ? 'Создайте кабинет Ozon. После создания запустите «Обновить данные» — загрузится каталог товаров.'
          : 'Укажите API-токен WB и его тип. Если не ввести название кабинета, оно подставится из ответа WB.'}
      </Text>
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        initialValues={{ marketplaceType: 'WB' }}
        onFinish={(values) => {
          if (values.marketplaceType === 'OZON') {
            const trimmedName = values.name?.trim()
            if (!trimmedName) {
              return
            }
            const body: CreateCabinetRequest = {
              marketplaceType: 'OZON',
              apiKey: values.apiKey!.trim(),
              ozonClientId: values.ozonClientId!.trim(),
              name: trimmedName,
            }
            onSubmit(body)
            return
          }
          if (!values.tokenType || !values.apiKey) {
            return
          }
          const body: CreateCabinetRequest = {
            marketplaceType: 'WB',
            tokenType: values.tokenType,
            apiKey: values.apiKey.trim(),
          }
          const trimmedName = values.name?.trim()
          if (trimmedName) {
            body.name = trimmedName
          }
          onSubmit(body)
        }}
      >
        {/* Ловушки автозаполнения (Chrome/Yandex подставляют email/пароль в Client-Id и Api-Key). */}
        <input
          type="text"
          autoComplete="username"
          name="cabinet-create-username-trap"
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
          readOnly
          value=""
        />
        <input
          type="password"
          autoComplete="current-password"
          name="cabinet-create-password-trap"
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
          readOnly
          value=""
        />

        <Form.Item
          name="marketplaceType"
          label="Маркетплейс"
          rules={[{ required: true, message: 'Выберите маркетплейс' }]}
        >
          <Select
            options={[
              {
                value: 'WB',
                label: (
                  <Space size={8}>
                    <MarketplaceTypeTag type="WB" size={16} />
                    <span>Wildberries</span>
                  </Space>
                ),
              },
              {
                value: 'OZON',
                label: (
                  <Space size={8}>
                    <MarketplaceTypeTag type="OZON" size={16} />
                    <span>Ozon</span>
                  </Space>
                ),
              },
            ]}
          />
        </Form.Item>

        {isOzon ? (
          <>
            <Form.Item
              name="ozonClientId"
              label="Client-Id"
              extra={<Text type="secondary" style={{ fontSize: 12 }}>{OZON_HINT}</Text>}
              rules={[{ required: true, whitespace: true, message: 'Введите Client-Id' }]}
            >
              <Input
                placeholder="Client-Id из кабинета продавца Ozon"
                autoComplete="off"
                name="ozon-seller-client-id"
                id="ozon-seller-client-id"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
              />
            </Form.Item>
            <Form.Item
              name="apiKey"
              label="Api-Key"
              rules={[{ required: true, whitespace: true, message: 'Введите Api-Key' }]}
            >
              <Input.Password
                prefix={<KeyOutlined />}
                placeholder="Api-Key Seller API"
                autoComplete="new-password"
                name="ozon-seller-api-key"
                id="ozon-seller-api-key"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
              />
            </Form.Item>
            <Form.Item
              name="name"
              label="Название кабинета"
              rules={[{ required: true, whitespace: true, message: 'Введите название кабинета' }]}
            >
              <Input
                placeholder="Например, Ozon основной"
                autoComplete="off"
                name="ozon-cabinet-display-name"
                data-form-type="other"
              />
            </Form.Item>
          </>
        ) : (
          <>
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
              <Input.Password
                prefix={<KeyOutlined />}
                placeholder="Введите токен"
                autoComplete="new-password"
                name="wb-api-token-create"
                id="wb-api-token-create"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
              />
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
              <Input
                placeholder="Необязательно — подставится из WB"
                autoComplete="off"
                name="wb-cabinet-display-name"
                data-form-type="other"
              />
            </Form.Item>
          </>
        )}
      </Form>
      <TokenCreationGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </Modal>
  )
}
