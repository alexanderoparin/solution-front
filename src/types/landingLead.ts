export type LandingLeadRequestType = 'audit' | 'consultation'

/** Код источника заявки — передаётся на бэкенд и попадает в письмо. */
export type LandingLeadRequestSource =
  | 'hero-consultation'
  | 'services-agency'
  | 'pricing-agency'
  | 'pricing-audit'
  | 'landing-service-pricing'
  | 'landing-service-manage'
  | 'landing-service-audit'

export interface LandingLeadRequest {
  type: LandingLeadRequestType
  source: LandingLeadRequestSource
}
