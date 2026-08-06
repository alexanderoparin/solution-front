export type AbTestStatus = 'PENDING_START' | 'ENABLED' | 'DISABLED'
export type AbTestRotationMode = 'ROTATION_BY_VIEWS' | 'ROTATION_BY_INTERVAL'
export type AbTestStopMode = 'TRUST_US' | 'BY_DURATION'
export type AbTestFinishAction = 'KEEP_WINNER' | 'RESTORE_ORIGINAL'
export type AbTestInsightCode = 'DATA_LOW' | 'NO_DIFF' | 'HAS_LEADER'

export interface AbTestVariant {
  id: number
  sortOrder: number
  control: boolean
  photoUrl: string | null
  previewUrl: string | null
  hasLocalImage?: boolean
  views: number
  clicks: number
  atbs: number
  orders: number
  ctr: number
  cr1: number
  cr: number
  sharePercent: number
  activeOnWb: boolean
  paused?: boolean
  ctrDeltaToBest: number | null
  losing: boolean
  /** Лидер CTR, когда есть проигрывающий вариант. */
  winning?: boolean
}

export interface AbTest {
  id: number
  cabinetId: number
  nmId: number
  title: string | null
  status: AbTestStatus
  rotationMode: AbTestRotationMode
  rotationViewsThreshold: number | null
  rotationIntervalMinutes: number | null
  stopMode: AbTestStopMode
  durationDays: number | null
  endsAt: string | null
  finishAction: AbTestFinishAction
  activeVariantId: number | null
  startedAt: string | null
  finishedAt: string | null
  insightCode: AbTestInsightCode | null
  insightLabel: string | null
  lastWbError?: string | null
  /** Упал/отменён на старте — можно перезапустить после смены токена. */
  canRestart?: boolean
  advertIds: number[]
  variants: AbTestVariant[]
}

export interface CreateAbTestRequest {
  nmId: number
  advertIds: number[]
  rotationMode: AbTestRotationMode
  rotationViewsThreshold?: number | null
  rotationIntervalMinutes?: number | null
  stopMode: AbTestStopMode
  durationDays?: number | null
  finishAction: AbTestFinishAction
}

/** Изменение настроек уже созданного теста (без карточки / РК / фото). */
export interface UpdateAbTestSettingsRequest {
  rotationMode: AbTestRotationMode
  rotationViewsThreshold?: number | null
  rotationIntervalMinutes?: number | null
  stopMode: AbTestStopMode
  durationDays?: number | null
  finishAction: AbTestFinishAction
}
