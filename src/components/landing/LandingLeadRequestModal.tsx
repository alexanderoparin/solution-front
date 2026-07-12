import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button, Checkbox, Form, Input, Modal, message } from 'antd'
import { publicApi } from '../../api/public'
import { landingColors, landingRadii } from '../../styles/landing'

export type LandingLeadRequestType = 'audit' | 'consultation'

const TELEGRAM_PREFIX = '@'

interface LandingLeadRequestModalProps {
  type: LandingLeadRequestType | null
  onClose: () => void
}

interface LeadFormValues {
  name: string
  telegram: string
  additionalInfo?: string
  agreeToPrivacy: boolean
}

function normalizeTelegramInput(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return TELEGRAM_PREFIX
  }
  const username = trimmed.startsWith(TELEGRAM_PREFIX) ? trimmed.slice(1) : trimmed
  return `${TELEGRAM_PREFIX}${username.replace(/^@+/, '')}`
}

function isTelegramFilled(value: string | undefined): boolean {
  if (!value) {
    return false
  }
  return normalizeTelegramInput(value).length > TELEGRAM_PREFIX.length
}

const leadConfig: Record<
  LandingLeadRequestType,
  { title: string; submit: (payload: LeadFormValues) => ReturnType<typeof publicApi.submitCabinetAuditRequest> }
> = {
  audit: {
    title: 'Запись на аудит рекламного кабинета',
    submit: (payload) => publicApi.submitCabinetAuditRequest(payload),
  },
  consultation: {
    title: 'Консультация по ведению рекламных кабинетов',
    submit: (payload) => publicApi.submitAgencyConsultationRequest(payload),
  },
}

export default function LandingLeadRequestModal({ type, onClose }: LandingLeadRequestModalProps) {
  const [form] = Form.useForm<LeadFormValues>()
  const config = type ? leadConfig[type] : null

  useEffect(() => {
    if (type) {
      form.setFieldsValue({
        name: undefined,
        telegram: TELEGRAM_PREFIX,
        additionalInfo: undefined,
        agreeToPrivacy: false,
      })
    }
  }, [type, form])

  const submitMutation = useMutation({
    mutationFn: (values: LeadFormValues) => {
      if (!config) {
        return Promise.reject(new Error('Не выбран тип заявки'))
      }
      const additionalInfo = values.additionalInfo?.trim()
      return config.submit({
        name: values.name.trim(),
        telegram: normalizeTelegramInput(values.telegram),
        additionalInfo: additionalInfo || undefined,
        agreeToPrivacy: values.agreeToPrivacy,
      })
    },
    onSuccess: (response) => {
      message.success(response.message || 'Запрос отправлен')
      form.resetFields()
      form.setFieldsValue({ telegram: TELEGRAM_PREFIX })
      onClose()
    },
    onError: (error: { response?: { data?: { message?: string; error?: string } } }) => {
      const msg = error.response?.data?.message ?? error.response?.data?.error ?? 'Не удалось отправить запрос'
      message.error(msg)
    },
  })

  const handleClose = () => {
    if (!submitMutation.isPending) {
      onClose()
    }
  }

  return (
    <Modal
      title={config?.title ?? ''}
      open={type != null}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ telegram: TELEGRAM_PREFIX }}
        onFinish={(values) => submitMutation.mutate(values)}
      >
        <Form.Item
          name="name"
          label="Имя"
          rules={[{ required: true, message: 'Укажите имя' }, { max: 120, message: 'Слишком длинное имя' }]}
        >
          <Input placeholder="Как к вам обращаться" size="large" />
        </Form.Item>
        <Form.Item
          name="telegram"
          label="Telegram"
          rules={[
            { required: true, message: 'Укажите Telegram' },
            { max: 64, message: 'Слишком длинный Telegram' },
            {
              validator: (_, value) =>
                isTelegramFilled(value) ? Promise.resolve() : Promise.reject(new Error('Укажите Telegram')),
            },
          ]}
        >
          <Input
            placeholder="username"
            size="large"
            onChange={(event) => {
              form.setFieldValue('telegram', normalizeTelegramInput(event.target.value))
            }}
          />
        </Form.Item>
        <Form.Item name="additionalInfo" label="Дополнительная информация">
          <Input.TextArea
            placeholder="Расскажите, если есть детали, которые важно учесть"
            rows={4}
            maxLength={2000}
            showCount
          />
        </Form.Item>
        <Form.Item
          name="agreeToPrivacy"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error('Необходимо согласие на обработку данных')),
            },
          ]}
        >
          <Checkbox>
            Я согласен(-на) на обработку персональных данных в соответствии с{' '}
            <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: landingColors.accent }}>
              политикой конфиденциальности
            </Link>
          </Checkbox>
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitMutation.isPending}
            style={{
              backgroundColor: landingColors.brandGreen,
              borderColor: landingColors.brandGreen,
              color: landingColors.textPrimary,
              borderRadius: landingRadii.md,
              fontWeight: 600,
              height: 44,
            }}
          >
            Отправить запрос
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
