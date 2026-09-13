import { Card, Typography, Tag, Space, Button, Input, Divider } from 'antd'
import {
  UserOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import type { UserProfileResponse, UserRole } from '../../types/api'
import { ACCOUNT_TYPE_TAG_COLORS, accountTypeLabel } from '../../constants/accountTypeLabels'
import { userRoleLabel, USER_ROLE_TAG_COLORS } from '../../constants/userRoleLabels'

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
  const displayName = profile.name?.trim() ?? ''
  const emailConfirmed = profile.emailConfirmed === true

  return (
    <>
      <style>{`
        .user-info-card.ant-card {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .user-info-card .ant-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .user-info-top-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px 24px;
          align-items: start;
        }
        .user-info-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .user-info-roles {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          min-height: 40px;
        }
        .user-info-email-row {
          display: flex;
          gap: 12px;
          align-items: center;
          min-width: 0;
        }
        .user-info-email-resend {
          min-width: 200px;
        }
        .user-info-footer {
          margin-top: auto;
        }
        .user-info-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          min-height: 40px;
        }
        .user-info-email-box {
          flex: 1 1 auto;
          min-width: 0;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-sizing: border-box;
        }
        @media (max-width: 640px) {
          .user-info-top-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .user-info-email-row {
            flex-wrap: wrap;
          }
          .user-info-email-resend {
            width: 100%;
            min-width: 0;
          }
          .user-info-email-box {
            height: auto;
            min-height: 40px;
            flex-wrap: wrap;
            padding: 8px 12px;
          }
          .user-info-footer-row {
            flex-direction: column;
            align-items: stretch;
          }
          .user-info-footer-row .ant-btn {
            width: 100%;
          }
          .user-info-meta-divider {
            display: none !important;
          }
        }
      `}</style>
      <Card
        className="user-info-card"
        title={
          <Space>
            <UserOutlined />
            <span>Информация о пользователе</span>
          </Space>
        }
        style={{
          minWidth: 0,
          borderRadius: 16,
          border: `1px solid ${border}`,
          boxSizing: 'border-box',
        }}
      >
        <div className="user-info-top-row">
          <div className="user-info-field">
            <Text type="secondary">Имя</Text>
            <Input
              value={displayName}
              placeholder="—"
              readOnly
              style={{ borderRadius: 10, height: 40, width: '100%' }}
            />
          </div>

          <div className="user-info-field">
            <Text type="secondary" style={isAdmin ? { visibility: 'hidden' } : undefined}>
              Роли
            </Text>
            <div
              className="user-info-roles"
              style={{ justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}
            >
              {isAdmin ? (
                <Tag
                  color={USER_ROLE_TAG_COLORS[profile.role as UserRole] ?? 'red'}
                  style={{ padding: '6px 16px', borderRadius: 12, fontWeight: 600, lineHeight: '20px', margin: 0 }}
                >
                  {userRoleLabel(profile.role)}
                </Tag>
              ) : accountTypes.length === 0 ? (
                <Tag style={{ margin: 0 }}>—</Tag>
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
                      margin: 0,
                    }}
                  >
                    {accountTypeLabel(type)}
                  </Tag>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="user-info-field" style={{ marginTop: 16 }}>
          <Text type="secondary">Email</Text>
          <div className="user-info-email-row">
            <div
              className="user-info-email-box"
              style={{ background: emailConfirmed ? '#F0FDF4' : '#FFFFFF' }}
            >
              <Text style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.email}
              </Text>
              {emailConfirmed ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#16a34a', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                  <CheckCircleOutlined /> Подтверждена
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#d97706', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                  <ExclamationCircleOutlined /> Не подтверждена
                </span>
              )}
            </div>

            {!emailConfirmed && (
              <Button
                className="user-info-email-resend"
                onClick={onEmailConfirmPrompt}
                style={{ borderRadius: 10, height: 40, padding: '0 16px', textAlign: 'left' }}
              >
                Отправить письмо повторно
              </Button>
            )}
          </div>
        </div>

        <div className="user-info-footer">
          <Divider style={{ margin: '16px 0' }} />

          <div className="user-info-footer-row">
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

              <span className="user-info-meta-divider" style={{ width: 1, height: 18, background: border, display: 'inline-block' }} />

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
        </div>
      </Card>
    </>
  )
}
