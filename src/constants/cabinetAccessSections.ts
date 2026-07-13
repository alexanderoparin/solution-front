import type { CabinetAccessSection } from '../types/api'

/** Подписи разделов доступа к кабинету для UI. */
export const CABINET_ACCESS_SECTION_LABELS: Record<CabinetAccessSection, string> = {
  PRODUCTS: 'Товары',
  SUMMARY: 'Сводная аналитика',
  AD_CAMPAIGNS: 'Рекламные кампании',
  CAMPAIGN_MANAGE: 'Управление РК',
}

export const CABINET_ACCESS_SECTION_OPTIONS: { value: CabinetAccessSection; label: string }[] = (
  Object.entries(CABINET_ACCESS_SECTION_LABELS) as [CabinetAccessSection, string][]
).map(([value, label]) => ({ value, label }))

export function formatCabinetAccessSections(sections: CabinetAccessSection[]): string {
  if (!sections.length) return '—'
  return sections.map((s) => CABINET_ACCESS_SECTION_LABELS[s] ?? s).join(', ')
}
