import { Card, Typography, Tag, Space, Button, Input, Divider } from 'antd'
import {
  UserOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import type { UserProfileResponse } from '../../types/api'
import { ACCOUNT_TYPE_TAG_COLORS, accountTypeLabel } from '../../constants/accountTypeLabels'
import { userRoleLabel, USER_ROLE_TAG_COLORS } from '../../constants/userRoleLabels'
import type { UserRole } from '../../types/api'

dayjs.locale('ru')

const { Text } = Typography

const border = '#E2E8F0'

interface UserInfoCardProps {
  profile: UserProfileResponse
  onEdit: () => void
  onEmailConfirmPrompt: () => void
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return dayjs(dateString).format('DD.MM.YYYY')
}

export default function UserInfoCard({ profile, onEdit, onEmailConfirmPrompt }: UserInfoCardProps) {
  const accountTypes = profile.accountTypes ?? []
  const isAdmin = profile.role === 'ADMIN'
  const showEmailRow = !isAdmin
  const displayName = profile.name?.trim() ?? ''
  const emailConfirmed = profile.emailConfirmed === true

  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          <span>Информация о пользователе</span>
        </Space>
      }
      style={{
        height: '100%',
        borderRadius: 16,
        border: `1px solid ${border}`,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 420px) 1fr', gap: 24, alignItems: 'end' }}>
        <div>
          <Text type="secondary">Имя</Text>
          <Input
            value={displayName}
            placeholder="—"
            readOnly
            style={{ borderRadius: 10, height: 40, maxWidth: 420 }}
          />
        </div>

        <div>
          <Text type="secondary">Роли</Text>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {accountTypes.length === 0 ? (
              <Tag>—</Tag>
            ) : (
              accountTypes.map((type) => (
                <Tag
                  key={type}
                  color={ACCOUNT_TYPE_TAG_COLORS[type]}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 12,
                    fontWeight: 600,
                    lineHeight: '20px',
                  }}
                >
                  {accountTypeLabel(type)}
                </Tag>
              ))
            )}
            {isAdmin && (
              <Tag
                color={USER_ROLE_TAG_COLORS[profile.role as UserRole] ?? 'red'}
                style={{ padding: '6px 16px', borderRadius: 12, fontWeight: 600, lineHeight: '20px' }}
              >
                {userRoleLabel(profile.role)}
              </Tag>
            )}
          </div>
        </div>
      </div>

      {showEmailRow && (
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Email</Text>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div
              style={{
                flex: '1 1 auto',
                minWidth: 0,
                height: 40,
                borderRadius: 10,
                border: `1px solid ${border}`,
                background: emailConfirmed ? '#F0FDF4' : '#FFFFFF',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <Text style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.email}
              </Text>
              {emailConfirmed ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
                  <CheckCircleOutlined /> Подтверждена
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#d97706', fontSize: 13, fontWeight: 600 }}>
                  <ExclamationCircleOutlined /> Не подтверждена
                </span>
              )}
            </div>

            <Button
              onClick={onEmailConfirmPrompt}
              style={{ borderRadius: 10, height: 40, padding: '0 16px', minWidth: 240, textAlign: 'left' }}
            >
              Отправить письмо повторно
            </Button>
          </div>
        </div>
      )}

      <Divider style={{ margin: '16px 0' }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          paddingTop: 8,
          paddingBottom: 8,
          minHeight: 56,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text type="secondary">Статус</Text>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: profile.isActive ? '#16a34a' : '#94a3b8',
                display: 'inline-block',
              }} />
              <Text strong style={{ color: profile.isActive ? '#16a34a' : '#64748B' }}>
                {profile.isActive ? 'Активен' : 'Неактивен'}
              </Text>
            </span>
          </div>

          <span style={{ width: 1, height: 18, background: border, display: 'inline-block' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text type="secondary">Дата регистрации:</Text>
            <Text strong>{formatDate(profile.createdAt)}</Text>
          </div>
        </div>

        <Button
          icon={<EditOutlined />}
          type="default"
          onClick={onEdit}
          style={{ borderRadius: 10, height: 40, padding: '0 16px' }}
        >
          Редактировать
        </Button>
      </div>
    </Card>
  )
}
