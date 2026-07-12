import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button, Checkbox, Form, Input, Modal, message } from 'antd'
import { publicApi } from '../../api/public'
import { landingColors, landingRadii } from '../../styles/landing'

export type LandingLeadRequestType = 'audit' | 'consultation'

interface LandingLeadRequestModalProps {
  type: LandingLeadRequestType | null
  onClose: () => void
}

interface LeadFormValues {
  name: string
  telegram: string
  agreeToPrivacy: boolean
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

  const submitMutation = useMutation({
    mutationFn: (values: LeadFormValues) => {
      if (!config) {
        return Promise.reject(new Error('Не выбран тип заявки'))
      }
      return config.submit({
        name: values.name.trim(),
        telegram: values.telegram.trim(),
        agreeToPrivacy: values.agreeToPrivacy,
      })
    },
    onSuccess: (response) => {
      message.success(response.message || 'Запрос отправлен')
      form.resetFields()
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
          rules={[{ required: true, message: 'Укажите Telegram' }, { max: 64, message: 'Слишком длинный Telegram' }]}
        >
          <Input placeholder="@username" size="large" />
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
