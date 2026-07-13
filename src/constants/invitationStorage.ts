/** Ключ sessionStorage: токен приглашения в кабинет (страница /invite). */
export const INVITATION_TOKEN_STORAGE_KEY = 'cabinet_invitation_token'

export function getStoredInvitationToken(): string | null {
  return sessionStorage.getItem(INVITATION_TOKEN_STORAGE_KEY)
}

export function setStoredInvitationToken(token: string): void {
  sessionStorage.setItem(INVITATION_TOKEN_STORAGE_KEY, token)
}

export function clearStoredInvitationToken(): void {
  sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY)
}
