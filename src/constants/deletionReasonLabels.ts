import type { AccountDeletionReason } from '../types/api'

export const DELETION_REASON_LABELS: Record<AccountDeletionReason, string> = {
  NOT_USING: 'Больше не пользуюсь сервисом',
  OTHER_SERVICE: 'Перехожу на другой сервис',
  FUNCTIONALITY: 'Не хватает функционала',
  TOO_EXPENSIVE: 'Слишком дорого',
  OTHER: 'Другое',
}

export function deletionReasonLabel(reason: AccountDeletionReason): string {
  return DELETION_REASON_LABELS[reason]
}
