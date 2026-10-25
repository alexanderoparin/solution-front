import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Row, Col, Spin, Typography, Button, Space, message, Segmented, Badge } from 'antd'
import {
  SettingOutlined,
  CreditCardOutlined,
  ApiOutlined,
  DeleteOutlined,
  GiftOutlined,
  CrownOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import Header from '../../components/Header'
import Breadcrumbs from '../../components/Breadcrumbs'
import UsersManagementSection from '../../components/UsersManagementSection'
import { ACCESS_STATUS_QUERY_KEY, userApi } from '../../api/user'
import { adminApi } from '../../api/admin'
import type { CreateDeletionRequestRequest, UpdateProfileRequest, UserProfileResponse } from '../../types/api'
import { getRequestFailureDescription } from '../../utils/requestError'
import { useAuthStore } from '../../store/authStore'
import { USER_MANAGEMENT_VIEW, type UserManagementView } from '../../constants/userManagementView'
import UserInfoCard from './UserInfoCard'
import SecurityCard from './SecurityCard'
import CabinetsCard from './CabinetsCard'
import EditProfileModal from './modals/EditProfileModal'
import LogoutConfirmModal from './modals/LogoutConfirmModal'
import DeletionRequestModal from './modals/DeletionRequestModal'
import EmailConfirmPromptModal from './modals/EmailConfirmPromptModal'
import EmailConfirmedModal from './modals/EmailConfirmedModal'
import EmailConfirmAfterRegisterModal from './modals/EmailConfirmAfterRegisterModal'
import { EMAIL_CONFIRMED_MODAL_KEY } from '../../constants/emailConfirmStorage'
import { NEED_EMAIL_CONFIRM_MODAL_KEY } from '../../constants/needEmailConfirmStorage'

dayjs.locale('ru')

const { Text } = Typography

const border = '#E2E8F0'

const profileAdminActionGridButtonStyle = { fontSize: 14, minHeight: 48 } as const

export default function ProfilePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [searchParams, setSearchParams] = useSearchParams()

  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [deletionRequestOpen, setDeletionRequestOpen] = useState(false)
  const [emailConfirmPromptOpen, setEmailConfirmPromptOpen] = useState(false)
  const [emailConfirmedOpen, setEmailConfirmedOpen] = useState(false)
  const [afterRegisterConfirmOpen, setAfterRegisterConfirmOpen] = useState(false)
  const [addCabinetOpen, setAddCabinetOpen] = useState(false)
  const [usersBlockView, setUsersBlockView] = useState<UserManagementView>(USER_MANAGEMENT_VIEW.CABINETS)

  const clearSearchParam = useCallback(
    (key: string) => {
      const next = new URLSearchParams(searchParams)
      next.delete(key)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const { data: profile, isLoading, error } = useQuery<UserProfileResponse>({
    queryKey: ['userProfile'],
    queryFn: () => userApi.getProfile(),
  })

  const isAdminProfile = profile?.role === 'ADMIN'

  const { data: pendingDeletionCount = 0 } = useQuery({
    queryKey: ['pendingDeletionRequestsCount'],
    queryFn: () => adminApi.getPendingDeletionRequestsCount(),
    enabled: isAdminProfile,
    staleTime: 30_000,
  })

  useEffect(() => {
    let showConfirmedModal = searchParams.get('emailConfirmed') === '1'
    try {
      if (sessionStorage.getItem(EMAIL_CONFIRMED_MODAL_KEY) === '1') {
        showConfirmedModal = true
        sessionStorage.removeItem(EMAIL_CONFIRMED_MODAL_KEY)
      }
    } catch {
      /* ignore */
    }
    if (showConfirmedModal) {
      setEmailConfirmedOpen(true)
      if (searchParams.get('emailConfirmed') === '1') {
        clearSearchParam('emailConfirmed')
      }
    }
    if (searchParams.get('registered') === '1') {
      setAfterRegisterConfirmOpen(true)
      clearSearchParam('registered')
    }
    try {
      if (sessionStorage.getItem(NEED_EMAIL_CONFIRM_MODAL_KEY) === '1') {
        sessionStorage.removeItem(NEED_EMAIL_CONFIRM_MODAL_KEY)
        setAfterRegisterConfirmOpen(true)
      }
    } catch {
      /* ignore */
    }
    if (searchParams.get('addCabinet') === '1') {
      setAddCabinetOpen(true)
      clearSearchParam('addCabinet')
    }
    if (searchParams.get('inviteAccepted') === '1') {
      message.success('Приглашение принято')
      void queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      clearSearchParam('inviteAccepted')
    }
  }, [searchParams, clearSearchParam, queryClient])

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => userApi.updateProfile(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      message.success('Профиль обновлён')
      setEditProfileOpen(false)
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
  })

  const createDeletionRequestMutation = useMutation({
    mutationFn: (data: CreateDeletionRequestRequest) => userApi.createDeletionRequest(data),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      message.success(data.message || 'Заявка на удаление отправлена')
      setDeletionRequestOpen(false)
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
  })

  const sendEmailConfirmationMutation = useMutation({
    mutationFn: () => userApi.sendEmailConfirmation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      message.success('Письмо для подтверждения отправлено на вашу почту.')
      setEmailConfirmPromptOpen(false)
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
  })

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text type="danger">Ошибка загрузки профиля</Text>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const isAdmin = profile.role === 'ADMIN'

  return (
    <>
      <Header />
      <Breadcrumbs />
      <div
        className="profile-page"
        style={{
          width: '100%',
          padding: 24,
          minHeight: '100vh',
          backgroundColor: '#F8FAFC',
          minWidth: 0,
          overflowX: 'auto',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', minWidth: 0 }}>
          <Row gutter={{ xs: 12, sm: 16, lg: 24 }} style={{ marginBottom: 24 }} wrap>
            <Col xs={24} lg={16} style={{ minWidth: 0, display: 'flex' }}>
              <UserInfoCard
                profile={profile}
                onEdit={() => setEditProfileOpen(true)}
                onEmailConfirmPrompt={() => setEmailConfirmPromptOpen(true)}
              />
            </Col>
            <Col xs={24} lg={8} style={{ minWidth: 0, maxWidth: '100%', display: 'flex' }}>
              <SecurityCard
                profile={profile}
                onLogoutClick={() => setLogoutConfirmOpen(true)}
                onDeleteClick={() => setDeletionRequestOpen(true)}
              />
            </Col>
          </Row>

          {!isAdmin && (
            <Card
              className="profile-subscription-promo"
              style={{
                marginBottom: 24,
                borderRadius: 16,
                border: `1px solid ${border}`,
              }}
              styles={{ body: { padding: '20px 24px' } }}
            >
              <div className="profile-subscription-promo-inner">
                <div className="profile-subscription-promo-copy">
                  <div className="profile-subscription-promo-icon">
                    <CrownOutlined style={{ color: '#7C3AED', fontSize: 20 }} />
                  </div>
                  <div className="profile-subscription-promo-text">
                    <div className="profile-subscription-promo-title">
                      Подписка и тарифы
                    </div>
                    <Text type="secondary" className="profile-subscription-promo-desc">
                      Подключайте тарифы и дополнительные услуги, управляйте подпиской и смотрите историю платежей.
                    </Text>
                  </div>
                </div>
                <Button
                  type="primary"
                  size="large"
                  className="profile-subscription-promo-btn"
                  onClick={() => navigate('/subscription')}
                  style={{
                    background: '#7C3AED',
                    borderColor: '#7C3AED',
                    height: 44,
                    borderRadius: 12,
                    fontWeight: 600,
                  }}
                >
                  Перейти к подписке
                  <ArrowRightOutlined />
                </Button>
              </div>
              <style>{`
                .profile-subscription-promo-inner {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 16px;
                }
                .profile-subscription-promo-copy {
                  display: flex;
                  align-items: center;
                  gap: 14px;
                  min-width: 0;
                  flex: 1;
                }
                .profile-subscription-promo-icon {
                  width: 44px;
                  height: 44px;
                  border-radius: 12px;
                  background: #F5F3FF;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                }
                .profile-subscription-promo-text {
                  min-width: 0;
                }
                .profile-subscription-promo-title {
                  font-weight: 700;
                  font-size: 16px;
                  color: #0F172A;
                  margin-bottom: 4px;
                  line-height: 1.3;
                }
                .profile-subscription-promo-desc {
                  font-size: 13px;
                  line-height: 1.45;
                  display: block;
                }
                .profile-subscription-promo-btn {
                  flex-shrink: 0;
                }
                @media (max-width: 640px) {
                  .profile-subscription-promo .ant-card-body {
                    padding: 16px !important;
                  }
                  .profile-subscription-promo-inner {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 14px;
                  }
                  .profile-subscription-promo-copy {
                    align-items: flex-start;
                    gap: 12px;
                  }
                  .profile-subscription-promo-icon {
                    width: 40px;
                    height: 40px;
                  }
                  .profile-subscription-promo-title {
                    font-size: 15px;
                    margin-bottom: 2px;
                  }
                  .profile-subscription-promo-desc {
                    font-size: 12px;
                    line-height: 1.4;
                  }
                  .profile-subscription-promo-btn {
                    width: 100%;
                    height: 44px !important;
                  }
                }
              `}</style>
            </Card>
          )}

          {!isAdmin && (
            <CabinetsCard
              addCabinetOpen={addCabinetOpen}
              onAddCabinetOpenChange={setAddCabinetOpen}
              subscription={profile.subscription}
              agencyManaged={profile.agencyManaged === true}
            />
          )}

          {isAdmin && (
            <Card
              title={
                <Space>
                  <SettingOutlined />
                  <span>Администрирование</span>
                </Space>
              }
              style={{
                marginBottom: 24,
                borderRadius: 16,
                border: `1px solid ${border}`,
              }}
            >
              <div
                className="profile-admin-actions"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Button
                  icon={<ApiOutlined />}
                  onClick={() => navigate('/admin/api-events')}
                  size="large"
                  style={profileAdminActionGridButtonStyle}
                >
                  API события
                </Button>
                <Button
                  icon={<CreditCardOutlined />}
                  onClick={() => navigate('/admin/plans')}
                  size="large"
                  style={profileAdminActionGridButtonStyle}
                >
                  Тарифы и услуги
                </Button>
                <Button
                  icon={<GiftOutlined />}
                  onClick={() => navigate('/admin/promo-codes')}
                  size="large"
                  style={profileAdminActionGridButtonStyle}
                >
                  Промокоды
                </Button>
                <Badge count={pendingDeletionCount} overflowCount={99} offset={[-4, 4]}>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={() => navigate('/admin/deletion-requests')}
                    size="large"
                    style={profileAdminActionGridButtonStyle}
                  >
                    Заявки на удаление
                  </Button>
                </Badge>
              </div>
            </Card>
          )}
        </div>

        {isAdmin && (
          <Card
            title={
              <Segmented
                size="small"
                options={[
                  { label: 'Кабинеты', value: USER_MANAGEMENT_VIEW.CABINETS },
                  { label: 'Пользователи', value: USER_MANAGEMENT_VIEW.USERS },
                ]}
                value={usersBlockView}
                onChange={(value) => setUsersBlockView(value as UserManagementView)}
              />
            }
            styles={{
              body: {
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                minWidth: 0,
              },
            }}
            style={{
              borderRadius: 16,
              border: `1px solid ${border}`,
              minWidth: 0,
            }}
          >
            <UsersManagementSection
              managementView={usersBlockView}
              onManagementViewChange={setUsersBlockView}
            />
          </Card>
        )}
      </div>

      <EditProfileModal
        open={editProfileOpen}
        profile={profile}
        loading={updateProfileMutation.isPending}
        onCancel={() => setEditProfileOpen(false)}
        onSubmit={(values) => updateProfileMutation.mutate(values)}
      />

      <LogoutConfirmModal
        open={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
      />

      <DeletionRequestModal
        open={deletionRequestOpen}
        loading={createDeletionRequestMutation.isPending}
        onCancel={() => setDeletionRequestOpen(false)}
        onSubmit={(values) => createDeletionRequestMutation.mutate(values)}
      />

      <EmailConfirmPromptModal
        open={emailConfirmPromptOpen}
        profile={profile}
        loading={sendEmailConfirmationMutation.isPending}
        onCancel={() => setEmailConfirmPromptOpen(false)}
        onSend={() => sendEmailConfirmationMutation.mutate()}
      />

      <EmailConfirmedModal
        open={emailConfirmedOpen}
        onAccepted={() => {
          setEmailConfirmedOpen(false)
          void queryClient.invalidateQueries({ queryKey: ['userProfile'] })
          void queryClient.invalidateQueries({ queryKey: ACCESS_STATUS_QUERY_KEY })
        }}
        onAddCabinet={() => {
          setEmailConfirmedOpen(false)
          setAddCabinetOpen(true)
          void queryClient.invalidateQueries({ queryKey: ['userProfile'] })
          void queryClient.invalidateQueries({ queryKey: ACCESS_STATUS_QUERY_KEY })
        }}
      />

      <EmailConfirmAfterRegisterModal
        open={afterRegisterConfirmOpen}
        onClose={() => setAfterRegisterConfirmOpen(false)}
      />

    </>
  )
}
