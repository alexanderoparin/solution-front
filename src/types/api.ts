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
}

export interface UpdateApiKeyRequest {
  wbApiKey: string
}

