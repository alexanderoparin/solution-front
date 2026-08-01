import { subscriptionApi } from '../api/subscription'
import { getStoredCabinetId } from '../api/cabinets'

const CAMPAIGN_FREE_PLAN_CODE = 'campaign_free'

/**
 * Активирует бесплатный пробный план «Управление РК» (campaign_free) для текущего кабинета.
 */
export async function activateBidderTrialPlanIfAvailable(cabinetId?: number | null): Promise<void> {
  const status = await subscriptionApi.getStatus()
  if (!status.campaignManagementEnabled) {
    return
  }

  const resolvedCabinetId = cabinetId ?? getStoredCabinetId()
  if (resolvedCabinetId == null) {
    return
  }

  const plans = await subscriptionApi.getCampaignManagePlans()
  const freePlan = plans.find((plan) => plan.code === CAMPAIGN_FREE_PLAN_CODE)
  if (!freePlan) {
    return
  }

  await subscriptionApi.activatePlan(freePlan.id, resolvedCabinetId)
}
