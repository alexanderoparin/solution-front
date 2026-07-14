export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  email: string
  role: string
  userId: number
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface MessageResponse {
  message: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  /** Согласие с офертой и политикой конфиденциальности (обязательно). */
  agreeToOffer: boolean
  /** Согласие на информационные и маркетинговые сообщения (необязательно). */
  marketingConsent?: boolean
  /** Типы аккаунта (минимум один). */
  accountTypes: AccountType[]
  /** Токен приглашения (регистрация по invite). */
  invitationToken?: string
}

/** Номинальный тип аккаунта (статистика и отображение, не права доступа). */
export type AccountType = 'SELLER' | 'AGENCY' | 'EMPLOYEE'

/** Причина удаления аккаунта. */
export type AccountDeletionReason =
  | 'NOT_USING'
  | 'OTHER_SERVICE'
  | 'FUNCTIONALITY'
  | 'TOO_EXPENSIVE'
  | 'OTHER'

/** Статус заявки на удаление аккаунта. */
export type AccountDeletionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** Краткая информация о подписке для профиля. */
export interface ProfileSubscriptionSummary {
  planName: string
  planCode?: string | null
  statusLabel: string
  active: boolean
  expiresAt?: string | null
  nextBillingAt?: string | null
  autoRenew: boolean
  freePlanHint?: string | null
}

/** Статус заявки на удаление в профиле. */
export interface AccountDeletionStatus {
  hasPendingRequest: boolean
  status?: AccountDeletionRequestStatus | null
  message?: string | null
}

/** Заявка на удаление аккаунта (админский список). */
export interface AccountDeletionRequestAdminDto {
  id: number
  userId: number
  userEmail: string
  userName: string | null
  reason: AccountDeletionReason
  comment: string | null
  status: AccountDeletionRequestStatus
  createdAt: string
}

export interface UpdateProfileRequest {
  name?: string
  accountTypes?: AccountType[]
}

export interface CreateDeletionRequestRequest {
  reason: AccountDeletionReason
  comment?: string
}

export interface UserProfileResponse {
  id: number
  /** Отображаемое имя пользователя */
  name?: string | null
  email: string
  role: string
  /** Типы аккаунта (может быть несколько) */
  accountTypes?: AccountType[]
  isActive: boolean
  /** Почта подтверждена */
  emailConfirmed?: boolean
  /** Дата последней отправки письма для подтверждения почты (ISO), повтор не чаще 1 раза в 12 ч */
  lastEmailConfirmationSentAt?: string | null
  /** Дата регистрации */
  createdAt?: string | null
  /** Сводка по тарифу */
  subscription?: ProfileSubscriptionSummary | null
  /** Заявка на удаление аккаунта */
  deletionRequest?: AccountDeletionStatus | null
  /** @deprecated legacy-поле, может отсутствовать в новом API */
  apiKey?: ApiKeyInfo
}

export interface ApiKeyInfo {
  apiKey: string | null
  tokenType?: CabinetTokenType | null
  isValid: boolean | null
  lastValidatedAt: string | null
  validationError: string | null
  lastDataUpdateAt: string | null
}

export interface UpdateApiKeyRequest {
  wbApiKey: string
}

export type UserRole = 'ADMIN' | 'USER'

export interface UserListItem {
  id: number
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  ownerEmail: string | null
  /** Email менеджеров с активным доступом (для SELLER) */
  managerEmails?: string[] | null
  /** Клиент агентства: Управление РК без подписки (только для SELLER) */
  agencyManaged?: boolean | null
  lastDataUpdateAt: string | null
  lastDataUpdateRequestedAt: string | null
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface CreateUserRequest {
  email: string
  password: string
  role: UserRole
  /** Клиент агентства (только для SELLER, задаёт ADMIN при создании) */
  agencyManaged?: boolean
}

export interface UpdateUserRequest {
  email: string
  isActive?: boolean
  /** Клиент агентства (меняет ADMIN) */
  agencyManaged?: boolean
}

export interface CabinetApiKeyInfo {
  apiKey: string | null
  tokenType?: CabinetTokenType | null
  isValid: boolean | null
  lastValidatedAt: string | null
  validationError: string | null
  lastDataUpdateAt: string | null
  /** Время запроса обновления (кнопка нажата, задача в очереди). Для блокировки кнопки. */
  lastDataUpdateRequestedAt: string | null
  /** Время последнего успешного завершения обновления остатков. */
  lastStocksUpdateAt?: string | null
}
/** Статус доступа к категории WB API по кабинету (результат последнего блока обновлений). */
export interface ScopeStatusDto {
  category: string
  categoryDisplayName: string
  lastCheckedAt: string | null
  success: boolean | null
  errorMessage: string | null
  writeBlockedUntil?: string | null
  writeReadOnly?: boolean
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
  /** Время запроса запуска обновления остатков по кабинету (кулдаун для кнопки). */
  lastStocksUpdateRequestedAt?: string | null
  /** Время последнего успешного завершения обновления остатков. */
  lastStocksUpdateAt?: string | null
  apiKey: CabinetApiKeyInfo | null
  /** Статусы доступа к категориям WB API по кабинету. */
  scopeStatuses?: ScopeStatusDto[]
}

/** Кабинет с данными владельца (плоский список для админа/менеджера). */
export interface ManagedCabinetRowDto {
  sellerId: number
  sellerEmail: string
  /** Клиент агентства (флаг на селлере; одинаков для всех его кабинетов). */
  agencyManaged?: boolean
  managerEmails?: string[]
  cabinet: CabinetDto
}

/** Кабинет с ключом для переключения контекста в шапке (ADMIN / MANAGER). */
export interface WorkContextCabinetDto {
  cabinetId: number
  sellerId: number
  cabinetName: string
  sellerEmail: string
  lastDataUpdateAt: string | null
  lastDataUpdateRequestedAt: string | null
  tokenType?: CabinetTokenType | null
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
  code?: string | null
  periodType?: 'DAYS' | 'CALENDAR_MONTH' | string | null
}

export interface CreatePlanRequest {
  name: string
  description?: string
  priceRub: number
  periodDays: number
  maxCabinets?: number
  sortOrder?: number
  isActive?: boolean
  code?: string
  periodType?: 'DAYS' | 'CALENDAR_MONTH' | string
}

export interface UpdatePlanRequest {
  name?: string
  description?: string
  priceRub?: number
  periodDays?: number
  maxCabinets?: number
  sortOrder?: number
  isActive?: boolean
  code?: string
  periodType?: 'DAYS' | 'CALENDAR_MONTH' | string
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

export type WbApiEventStatus =
  | 'CREATED'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED_RETRYABLE'
  | 'FAILED_FINAL'
  | 'FAILED_WITH_FALLBACK'
  | 'DEFERRED_RATE_LIMIT'
  | 'CANCELLED'

export type WbApiEventType =
  | 'CONTENT_CARDS_LIST_PAGE'
  | 'ANALYTICS_SALES_FUNNEL_NMID'
  | 'PRICES_CABINET_WITH_SPP'
  | 'PROMOTION_COUNT'
  | 'PROMOTION_ADVERTS_BATCH'
  | 'PROMOTION_STATS_BATCH'
  | 'PROMOTION_NORMQUERY_STATS_BATCH'
  | 'PROMOTION_CAMPAIGN_START'
  | 'PROMOTION_CAMPAIGN_PAUSE'
  | 'ANALYTICS_ITEM_RATING_CABINET'
  | 'PROMOTION_CALENDAR_SYNC_CABINET'
  | 'WAREHOUSES_SYNC_CABINET'
  | 'STOCKS_BY_NMID'

export type WbApiEventSortField =
  | 'ID'
  | 'EVENT_TYPE'
  | 'STATUS'
  | 'CABINET_ID'
  | 'ATTEMPT_COUNT'
  | 'MAX_ATTEMPTS'
  | 'STARTED_AT'
  | 'NEXT_ATTEMPT_AT'
  | 'CREATED_AT'
  | 'FINISHED_AT'

export type SortDirection = 'ASC' | 'DESC'

export interface WbApiEventDto {
  id: number
  eventType: WbApiEventType
  status: WbApiEventStatus
  executorBeanName: string
  cabinetId: number
  cabinetName: string | null
  dedupKey: string
  attemptCount: number
  maxAttempts: number
  nextAttemptAt: string
  lastError: string | null
  priority: number
  triggerSource: string
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  updatedAt: string
}

export interface WbApiEventStatsDto {
  total: number
  byStatus: Record<WbApiEventStatus, number>
}

export interface WbApiEventTypeStatsDto {
  baseStatus: WbApiEventStatus | null
  total: number
  byType: Record<WbApiEventType, number>
}

export interface WbApiEventCabinetStatsDto {
  baseStatus: WbApiEventStatus | null
  baseEventType: WbApiEventType | null
  total: number
  byCabinet: Array<{
    cabinetId: number
    cabinetName: string
    count: number
  }>
}

/** Статус подписки на «Управление РК». */
export interface CampaignManageAccessDto {
  enabled: boolean
  hasAccess: boolean
  status: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'AGENCY' | string
  expiresAt: string | null
  daysRemaining: number | null
  daysExpiredAgo: number | null
  canActivateFree: boolean
}

/** Ответ GET /user/access: доступ к функционалу и статус подписки */
export interface AccessStatusResponse {
  hasAccess: boolean
  emailConfirmed: boolean
  billingEnabled: boolean
  subscriptionStatus: string | null
  subscriptionExpiresAt: string | null
  campaignManage?: CampaignManageAccessDto | null
}

/** Ответ GET /subscription/status */
export interface SubscriptionStatusResponse {
  billingEnabled: boolean
  campaignManagementEnabled?: boolean
}

/** Ответ POST /subscription/activate */
export interface ActivatePlanResponse {
  subscriptionId: number
  expiresAt: string
}

/** Ответ POST /subscription/initiate-payment */
export interface InitiatePaymentResponse {
  paymentId: number
  paymentUrl: string
}

/** Ответ GET /subscription/payment/{id}/status */
export interface PaymentStatusResponse {
  paymentId: number
  status: string
  expiresAt?: string | null
}

/** Элемент списка платежей GET /user/payments */
export interface PaymentDto {
  id: number
  amount: number
  currency: string
  description: string | null
  /** Название тарифа на момент оплаты */
  planName?: string | null
  status: string
  paidAt: string | null
  createdAt: string
}

export interface CreateCabinetRequest {
  /** Необязательно: если не указано — берётся из WB seller-info. */
  name?: string
  apiKey: string
  tokenType: CabinetTokenType
}

/** Ответ API с ошибкой (часто 4xx/429). */
export interface ErrorResponseBody {
  error: string
  retryAfterSeconds?: number
}

export interface UpdateCabinetRequest {
  name?: string
  apiKey?: string
  tokenType?: CabinetTokenType
}

export type CabinetTokenType = 'PERSONAL' | 'BASIC'

/** Разделы сервиса, к которым может быть выдан доступ к кабинету. */
export type CabinetAccessSection = 'PRODUCTS' | 'SUMMARY' | 'AD_CAMPAIGNS' | 'CAMPAIGN_MANAGE'

export type CabinetAccessInvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'DECLINED' | 'EXPIRED'

export interface OwnedCabinetRowDto {
  id: number
  name: string
  createdAt: string
  lastValidatedAt: string | null
  apiKeyValid: boolean | null
  lastDataUpdateAt: string | null
  apiKeyMasked: string | null
}

export interface GrantedCabinetRowDto {
  id: number
  name: string
  accessFrom: string
  accessUntil: string | null
  lastValidatedAt: string | null
  apiKeyValid: boolean | null
  lastDataUpdateAt: string | null
  apiKeyMasked: string | null
  grantedByName: string | null
  sections: CabinetAccessSection[]
}

/** Ожидающее принятия приглашение в кабинет (для профиля приглашённого). */
export interface PendingCabinetInvitationRowDto {
  token: string
  cabinetId: number
  cabinetName: string
  inviterName: string | null
  inviterEmail: string | null
  sections: CabinetAccessSection[]
  accessUntil: string | null
  expiresAt: string
  createdAt: string
}

export interface CabinetsOverviewDto {
  owned: OwnedCabinetRowDto[]
  granted: GrantedCabinetRowDto[]
  pendingInvitations?: PendingCabinetInvitationRowDto[]
}

export interface CabinetAccessEntryDto {
  id: number
  kind: 'GRANT' | 'INVITATION' | string
  userName: string | null
  userEmail: string
  sections: CabinetAccessSection[]
  accessFrom: string
  accessUntil: string | null
  grantedByLabel: string
  grantedAt: string
  invitationStatus?: CabinetAccessInvitationStatus | null
  statusLabel: string
}

export interface GrantCabinetAccessRequest {
  email: string
  comment?: string
  sections: CabinetAccessSection[]
  validUntil?: string | null
  accountType: Extract<AccountType, 'AGENCY' | 'EMPLOYEE'>
}

export interface UpdateCabinetAccessValidUntilRequest {
  validUntil?: string | null
}

export interface UpdateCabinetAccessSectionsRequest {
  sections: CabinetAccessSection[]
}

export interface CabinetInvitationPreviewDto {
  cabinetName: string
  inviterName: string
  inviterEmail: string
  sections: CabinetAccessSection[]
  expired: boolean
  alreadyAccepted: boolean
  declined?: boolean
  revoked?: boolean
  email: string
}