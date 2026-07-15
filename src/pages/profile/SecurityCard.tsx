import { useState, type CSSProperties, type ReactNode } from 'react'
import { Card, Space, Button, Modal, Form, Input, message, Typography } from 'antd'
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

interface SecurityActionRowProps {
  icon: ReactNode
  iconBg: string
  iconColor: string
  title: string
  titleColor?: string
  description: string
  onClick: () => void
  disabled?: boolean
}

function SecurityActionRow({
  icon,
  iconBg,
  iconColor,
  title,
  titleColor = '#111827',
  description,
  onClick,
  disabled = false,
}: SecurityActionRowProps) {
  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    margin: 0,
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${border}`,
    background: '#FFFFFF',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'left',
    opacity: disabled ? 0.65 : 1,
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} style={rowStyle}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, lineHeight: '20px', color: titleColor }}>{title}</div>
        <div
          style={{
            color: '#64748B',
            fontSize: 12,
            lineHeight: '16px',
            marginTop: 2,
            overflowWrap: 'anywhere',
          }}
        >
          {description}
        </div>
      </div>
      <RightOutlined style={{ color: '#94a3b8', fontSize: 12, flexShrink: 0 }} />
    </button>
  )
}

export default function SecurityCard({ profile, onLogoutClick, onDeleteClick }: SecurityCardProps) {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordForm] = Form.useForm()

  const deletionPending = profile.deletionRequest?.hasPendingRequest === true
  const isAdmin = profile.role === 'ADMIN'

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
      <style>{`
        .security-card.ant-card {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .security-card .ant-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          min-height: 0;
        }
        .security-card-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          flex: 1;
        }
        .security-card-footer {
          margin-top: auto;
          padding-top: 4px;
        }
      `}</style>
      <Card
        className="security-card"
        title={
          <Space>
            <LockOutlined />
            <span>Безопасность</span>
          </Space>
        }
        style={{
          minWidth: 0,
          borderRadius: 16,
          border: `1px solid ${border}`,
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div className="security-card-content">
          <SecurityActionRow
            icon={<LockOutlined style={{ fontSize: 18 }} />}
            iconBg="#EEF2FF"
            iconColor="#3B82F6"
            title="Сменить пароль"
            description="Выберите новый пароль для входа в систему"
            onClick={() => {
              passwordForm.resetFields()
              setPasswordModalOpen(true)
            }}
          />

          <SecurityActionRow
            icon={<LogoutOutlined style={{ fontSize: 18 }} />}
            iconBg="#FEF2F2"
            iconColor="#EF4444"
            title="Выйти из аккаунта"
            titleColor="#DC2626"
            description="Завершить текущую сессию"
            onClick={onLogoutClick}
          />

          {!isAdmin && !deletionPending && (
            <SecurityActionRow
              icon={<DeleteOutlined style={{ fontSize: 18 }} />}
              iconBg="#F1F5F9"
              iconColor="#EF4444"
              title="Удалить аккаунт"
              description="Удаление аккаунта через поддержку"
              onClick={onDeleteClick}
            />
          )}

          {!isAdmin && deletionPending && (
            <div className="security-card-footer">
              <Text type="secondary" style={{ fontSize: 12, display: 'block', lineHeight: 1.5 }}>
                Заявка на удаление уже отправлена и ожидает обработки. Если запрос был отправлен по ошибке,
                обратитесь в поддержку{' '}
                <a href="mailto:corp@click-i.ru" style={{ color: accent }}>
                  corp@click-i.ru
                </a>
              </Text>
            </div>
          )}
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
