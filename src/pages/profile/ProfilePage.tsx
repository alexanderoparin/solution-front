import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Row, Col, Spin, Typography, Button, Space, message, Segmented, Badge } from 'antd'
import {
  SettingOutlined,
  CreditCardOutlined,
  ApiOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import Header from '../../components/Header'
import Breadcrumbs from '../../components/Breadcrumbs'
import UsersManagementSection from '../../components/UsersManagementSection'
import { userApi } from '../../api/user'
import { adminApi } from '../../api/admin'
import type { CreateDeletionRequestRequest, UpdateProfileRequest, UserProfileResponse } from '../../types/api'
import { getRequestFailureDescription } from '../../utils/requestError'
import { useAuthStore } from '../../store/authStore'
import { USER_MANAGEMENT_VIEW, type UserManagementView } from '../../constants/userManagementView'
import UserInfoCard from './UserInfoCard'
import SecurityCard from './SecurityCard'
import SubscriptionCard from './SubscriptionCard'
import CabinetsCard from './CabinetsCard'
import EditProfileModal from './modals/EditProfileModal'
import LogoutConfirmModal from './modals/LogoutConfirmModal'
import DeletionRequestModal from './modals/DeletionRequestModal'
import EmailConfirmPromptModal from './modals/EmailConfirmPromptModal'
import EmailConfirmedModal from './modals/EmailConfirmedModal'
import EmailConfirmAfterRegisterModal from './modals/EmailConfirmAfterRegisterModal'
import { EMAIL_CONFIRMED_MODAL_KEY } from '../../constants/emailConfirmStorage'

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
        style={{
          width: '100%',
          padding: 24,
          minHeight: '100vh',
          backgroundColor: '#F8FAFC',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }} wrap>
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
            {!isAdmin && (
              <Col xs={24}>
                <SubscriptionCard subscription={profile.subscription} />
              </Col>
            )}
            {!isAdmin && (
              <Col xs={24}>
                <CabinetsCard
                  addCabinetOpen={addCabinetOpen}
                  onAddCabinetOpenChange={setAddCabinetOpen}
                />
              </Col>
            )}
          </Row>

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
                  onClick={() => navigate('/admin/wb-events')}
                  size="large"
                  style={profileAdminActionGridButtonStyle}
                >
                  WB API события
                </Button>
                <Button
                  icon={<CreditCardOutlined />}
                  onClick={() => navigate('/admin/plans')}
                  size="large"
                  style={profileAdminActionGridButtonStyle}
                >
                  Управление РК — планы
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
            style={{
              borderRadius: 16,
              border: `1px solid ${border}`,
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
        }}
        onAddCabinet={() => {
          setEmailConfirmedOpen(false)
          setAddCabinetOpen(true)
          void queryClient.invalidateQueries({ queryKey: ['userProfile'] })
        }}
      />

      <EmailConfirmAfterRegisterModal
        open={afterRegisterConfirmOpen}
        onClose={() => setAfterRegisterConfirmOpen(false)}
      />

    </>
  )
}
