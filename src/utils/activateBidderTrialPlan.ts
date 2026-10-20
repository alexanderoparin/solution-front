/**
 * Пробный период «Управление РК» отключён — no-op для обратной совместимости вызовов после регистрации.
 */
export async function activateBidderTrialPlanIfAvailable(_cabinetId?: number | null): Promise<void> {
  return
}
