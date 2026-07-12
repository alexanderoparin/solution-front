import { subscriptionApi } from '../api/subscription'

const CAMPAIGN_FREE_PLAN_CODE = 'campaign_free'

/**
 * Активирует бесплатный пробный план «Управление РК» (campaign_free), если модуль оплаты включён.
 */
export async function activateBidderTrialPlanIfAvailable(): Promise<void> {
  const status = await subscriptionApi.getStatus()
  if (!status.campaignManagementEnabled) {
    return
  }

  const plans = await subscriptionApi.getCampaignManagePlans()
  const freePlan = plans.find((plan) => plan.code === CAMPAIGN_FREE_PLAN_CODE)
  if (!freePlan) {
    return
  }

  await subscriptionApi.activatePlan(freePlan.id)
}
