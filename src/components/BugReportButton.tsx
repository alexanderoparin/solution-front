import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, Modal, Tooltip, message } from 'antd'
import { BugOutlined } from '@ant-design/icons'
import { userApi } from '../api/user'

interface BugReportFormValues {
  message: string
}

export default function BugReportButton() {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<BugReportFormValues>()

  const submitMutation = useMutation({
    mutationFn: (values: BugReportFormValues) =>
      userApi.submitBugReport({
        message: values.message.trim(),
        pageUrl: window.location.href,
      }),
    onSuccess: (response) => {
      message.success(response.message || 'Сообщение отправлено. Спасибо!')
      form.resetFields()
      setOpen(false)
    },
    onError: (error: { response?: { data?: { message?: string; error?: string } } }) => {
      const msg =
        error.response?.data?.message ?? error.response?.data?.error ?? 'Не удалось отправить сообщение'
      message.error(msg)
    },
  })

  const handleClose = () => {
    if (!submitMutation.isPending) {
      setOpen(false)
    }
  }

  return (
    <>
      <Tooltip title="Найден баг? Напиши">
        <Button
          type="text"
          aria-label="Найден баг? Напиши"
          icon={<BugOutlined style={{ fontSize: 18 }} />}
          onClick={() => setOpen(true)}
          style={{
            color: '#CBD5E1',
            width: 36,
            height: 36,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Tooltip>
      <Modal
        title="Найден баг?"
        open={open}
        onCancel={handleClose}
        footer={null}
        destroyOnClose
        width={480}
      >
        <p style={{ marginTop: 0, marginBottom: 16, lineHeight: 1.5 }}>
          Спасибо, что помогаете тестировать сервис! Будем рады вашей обратной связи: замечания, баги,
          предложения
        </p>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => submitMutation.mutate(values)}
        >
          <Form.Item
            name="message"
            rules={[
              { required: true, message: 'Напишите сообщение' },
              { max: 4000, message: 'Сообщение слишком длинное' },
            ]}
          >
            <Input.TextArea
              placeholder="Опишите, что произошло или что можно улучшить"
              rows={6}
              maxLength={4000}
              showCount
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={submitMutation.isPending}>
              Отправить
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
