export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  email: string
  role: string
  userId: number
  isTemporaryPassword?: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface MessageResponse {
  message: string
}

export interface RegisterRequest {
  email: string
  password: string
  /** Согласие с офертой и политикой конфиденциальности (обязательно). */
  agreeToOffer: boolean
  /** Согласие на информационные и маркетинговые сообщения (необязательно). */
  marketingConsent?: boolean
}

export interface UserProfileResponse {
  id: number
  email: string
  role: string
  isActive: boolean
  /** Почта подтверждена (только для сторонних селлеров) */
  emailConfirmed?: boolean
  /** Селлер является клиентом агентства */
  isAgencyClient?: boolean
  /** Дата последней отправки письма для подтверждения почты (ISO), повтор не чаще 1 раза в 24 ч */
  lastEmailConfirmationSentAt?: string | null
  apiKey?: ApiKeyInfo
}

export interface ApiKeyInfo {
  apiKey: string | null
  isValid: boolean | null
  lastValidatedAt: string | null
  validationError: string | null
  lastDataUpdateAt: string | null
}

export interface UpdateApiKeyRequest {
  wbApiKey: string
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'SELLER' | 'WORKER'

export interface UserListItem {
  id: number
  email: string
  role: UserRole
  isActive: boolean
  isTemporaryPassword: boolean
  createdAt: string
  ownerEmail: string | null
  lastDataUpdateAt: string | null
  lastDataUpdateRequestedAt: string | null
}

export interface CreateUserRequest {
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserRequest {
  email: string
  isActive?: boolean
}

export interface CabinetApiKeyInfo {
  apiKey: string | null
  isValid: boolean | null
  lastValidatedAt: string | null
  validationError: string | null
  lastDataUpdateAt: string | null
  /** Время запроса обновления (кнопка нажата, задача в очереди). Для блокировки кнопки. */
  lastDataUpdateRequestedAt: string | null
}
/** Статус доступа к категории WB API по кабинету (результат последнего блока обновлений). */
export interface ScopeStatusDto {
  category: string
  categoryDisplayName: string
  lastCheckedAt: string | null
  success: boolean | null
  errorMessage: string | null
}

export interface CabinetDto {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  /** Дата последнего обновления данных по кабинету (всегда в ответе). */
  lastDataUpdateAt: string | null
  /** Время запроса обновления по кабинету (всегда в ответе). */
  lastDataUpdateRequestedAt: string | null
  apiKey: CabinetApiKeyInfo | null
  /** Статусы доступа к категориям WB API по кабинету. */
  scopeStatuses?: ScopeStatusDto[]
}

export interface PlanDto {
  id: number
  name: string
  description: string | null
  priceRub: number
  periodDays: number
  maxCabinets: number | null
  sortOrder?: number
  isActive?: boolean
}

export interface CreatePlanRequest {
  name: string
  description?: string
  priceRub: number
  periodDays: number
  maxCabinets?: number
  sortOrder?: number
  isActive?: boolean
}

export interface UpdatePlanRequest {
  name?: string
  description?: string
  priceRub?: number
  periodDays?: number
  maxCabinets?: number
  sortOrder?: number
  isActive?: boolean
}

export interface SubscriptionDto {
  id: number
  userId: number
  planId: number | null
  planName: string | null
  status: string
  startedAt: string
  expiresAt: string
  createdAt: string
}

export interface ExtendSubscriptionRequest {
  userId: number
  planId: number
  expiresAt?: string
}

/** Статус кулдауна ручного запуска «обновить кабинеты» для админов/менеджеров (не чаще 1 раза в 5 мин). */
export interface TriggerCooldownResponse {
  lastTriggeredAtMs: number
  canTrigger: boolean
  nextAvailableInSeconds: number
}

/** Ответ GET /user/access: доступ к функционалу и статус подписки */
export interface AccessStatusResponse {
  hasAccess: boolean
  agencyClient: boolean
  emailConfirmed: boolean
  billingEnabled: boolean
  subscriptionStatus: string | null
  subscriptionExpiresAt: string | null
}

/** Ответ GET /subscription/status */
export interface SubscriptionStatusResponse {
  billingEnabled: boolean
}

/** Элемент списка платежей GET /user/payments */
export interface PaymentDto {
  id: number
  amount: number
  currency: string
  description: string | null
  status: string
  paidAt: string | null
  createdAt: string
}

/** Ответ POST /subscription/initiate */
export interface InitiatePaymentResponse {
  paymentUrl: string
  paymentId: number
}

export interface CreateCabinetRequest {
  name: string
}export interface UpdateCabinetRequest {
  name?: string
  apiKey?: string
}