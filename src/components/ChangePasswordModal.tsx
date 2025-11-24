import { useMutation } from '@tanstack/react-query'
import { Modal, Form, Input, Button, message } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import type { ChangePasswordRequest } from '../types/api'

interface ChangePasswordModalProps {
  open: boolean
  onSuccess: () => void
  onCancel: () => void
}

export default function ChangePasswordModal({
  open,
  onSuccess,
  onCancel,
}: ChangePasswordModalProps) {
  const [form] = Form.useForm()
  const email = useAuthStore((state) => state.email)

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: () => {
      form.resetFields()
      onSuccess()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка смены пароля')
    },
  })

  const handleFinish = (values: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Пароли не совпадают')
      return
    }

    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })
  }

  return (
    <Modal
      title="Смена пароля"
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={false}
      maskClosable={false}
      width={480}
    >
      <div style={{ marginBottom: 16 }}>
        <p style={{ color: '#64748B', marginBottom: 8 }}>
          Вы используете временный пароль. Пожалуйста, установите постоянный пароль для безопасности.
        </p>
        {email && (
          <p style={{ color: '#1E293B', fontWeight: 500 }}>
            Email: {email}
          </p>
        )}
      </div>

      <Form
        form={form}
        onFinish={handleFinish}
        layout="vertical"
        size="large"
        autoComplete="off"
      >
        <Form.Item
          label="Текущий пароль"
          name="currentPassword"
          rules={[{ required: true, message: 'Введите текущий пароль' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Введите текущий пароль"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item
          label="Новый пароль"
          name="newPassword"
          rules={[
            { required: true, message: 'Введите новый пароль' },
            { min: 6, message: 'Пароль должен содержать минимум 6 символов' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Введите новый пароль"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          label="Подтвердите новый пароль"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Подтвердите новый пароль' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Пароли не совпадают'))
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Подтвердите новый пароль"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={changePasswordMutation.isPending}
            block
            style={{
              backgroundColor: '#7C3AED',
              borderColor: '#7C3AED',
              height: 44,
            }}
          >
            Изменить пароль
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}

