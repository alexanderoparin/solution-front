/** Ключ sessionStorage: после регистрации активировать пробный тариф «Управление РК». */
export const REGISTER_BIDDER_TRIAL_KEY = 'registerBidderTrial'

export const REGISTER_BIDDER_TRIAL_PLAN_PARAM = 'bidder'

export const REGISTER_BIDDER_TRIAL_DAYS = 3

export function isBidderTrialRegisterSearch(search: string): boolean {
  return new URLSearchParams(search).get('plan') === REGISTER_BIDDER_TRIAL_PLAN_PARAM
}

export function markBidderTrialRegisterIntent(): void {
  sessionStorage.setItem(REGISTER_BIDDER_TRIAL_KEY, '1')
}

export function consumeBidderTrialRegisterIntent(): boolean {
  const pending = sessionStorage.getItem(REGISTER_BIDDER_TRIAL_KEY) === '1'
  if (pending) {
    sessionStorage.removeItem(REGISTER_BIDDER_TRIAL_KEY)
  }
  return pending
}
