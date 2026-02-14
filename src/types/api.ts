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

export interface UserProfileResponse {
  id: number
  email: string
  role: string
  isActive: boolean
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
}export interface CabinetDto {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  apiKey: CabinetApiKeyInfo | null
}

export interface CreateCabinetRequest {
  name: string
}

export interface UpdateCabinetRequest {
  name?: string
  apiKey?: string
}