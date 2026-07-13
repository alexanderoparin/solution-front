import { useState } from 'react'
import { Card, Space, Button, Modal, Form, Input, message, Alert, Typography } from 'antd'
import { LockOutlined, LogoutOutlined, DeleteOutlined, RightOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import type { ChangePasswordRequest, UserProfileResponse } from '../../types/api'

const { Text } = Typography

const accent = '#7C3AED'
const border = '#E2E8F0'

interface SecurityCardProps {
  profile: UserProfileResponse
  onLogoutClick: () => void
  onDeleteClick: () => void
}

export default function SecurityCard({ profile, onLogoutClick, onDeleteClick }: SecurityCardProps) {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordForm] = Form.useForm()

  const deletionPending = profile.deletionRequest?.hasPendingRequest === true

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: () => {
      message.success('Пароль успешно изменён')
      passwordForm.resetFields()
      setPasswordModalOpen(false)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      message.error(err.response?.data?.message || 'Ошибка смены пароля')
    },
  })

  const handlePasswordSubmit = (values: {
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

  const closePasswordModal = () => {
    setPasswordModalOpen(false)
    passwordForm.resetFields()
  }

  return (
    <>
      <Card
        title={
          <Space>
            <LockOutlined />
            <span>Безопасность</span>
          </Space>
        }
        style={{
          height: '100%',
          borderRadius: 16,
          border: `1px solid ${border}`,
        }}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <Button
            type="text"
            block
            onClick={() => {
              passwordForm.resetFields()
              setPasswordModalOpen(true)
            }}
            style={{
              padding: 12,
              height: 'auto',
              borderRadius: 12,
              border: `1px solid ${border}`,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3B82F6',
                }}>
                  <LockOutlined style={{ fontSize: 18 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontWeight: 600, lineHeight: '20px' }}>Сменить пароль</div>
                  <div style={{ color: '#64748B', fontSize: 12, lineHeight: '16px' }}>
                    Выберите новый пароль для входа в систему
                  </div>
                </div>
              </div>
              <RightOutlined style={{ color: '#94a3b8', fontSize: 12, marginLeft: 'auto' }} />
            </div>
          </Button>

          <Button
            type="text"
            block
            onClick={onLogoutClick}
            style={{
              padding: 12,
              height: 'auto',
              borderRadius: 12,
              border: `1px solid ${border}`,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#FEF2F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EF4444',
                }}>
                  <LogoutOutlined style={{ fontSize: 18 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontWeight: 600, color: '#DC2626', lineHeight: '20px' }}>Выйти из аккаунта</div>
                  <div style={{ color: '#64748B', fontSize: 12, lineHeight: '16px' }}>
                    Завершить текущую сессию
                  </div>
                </div>
              </div>
              <RightOutlined style={{ color: '#94a3b8', fontSize: 12, marginLeft: 'auto' }} />
            </div>
          </Button>

          <div style={{ marginTop: 0 }}>
            {deletionPending && profile.deletionRequest?.message && (
              <Alert style={{ marginTop: 8 }} type="info" showIcon message={profile.deletionRequest.message} />
            )}
            <Button
              type="text"
              block
              onClick={onDeleteClick}
              disabled={deletionPending}
              style={{
                marginTop: deletionPending && profile.deletionRequest?.message ? 8 : 0,
                padding: 12,
                height: 'auto',
                borderRadius: 12,
                border: `1px solid ${border}`,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#EF4444',
                    opacity: deletionPending ? 0.6 : 1,
                  }}>
                    <DeleteOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontWeight: 600, lineHeight: '20px', color: '#111827' }}>Удалить аккаунт</div>
                    <div style={{ color: '#64748B', fontSize: 12, lineHeight: '16px' }}>
                      {deletionPending ? 'Заявка уже отправлена' : 'Удаление аккаунта через поддержку'}
                    </div>
                  </div>
                </div>
                <RightOutlined style={{ color: '#94a3b8', fontSize: 12, marginLeft: 'auto' }} />
              </div>
            </Button>
            {deletionPending && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Заявка на удаление уже отправлена и ожидает обработки.
              </Text>
            )}
          </div>
        </div>
      </Card>

      <Modal
        title="Смена пароля"
        open={passwordModalOpen}
        destroyOnClose
        onCancel={closePasswordModal}
        footer={[
          <Button key="cancel" onClick={closePasswordModal}>
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={changePasswordMutation.isPending}
            style={{ backgroundColor: accent, borderColor: accent }}
            onClick={() => passwordForm.submit()}
          >
            Изменить пароль
          </Button>,
        ]}
      >
        <Form
          form={passwordForm}
          onFinish={handlePasswordSubmit}
          layout="vertical"
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
        </Form>
      </Modal>
    </>
  )
}
