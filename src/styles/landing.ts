/** Дизайн-токены лендинга Clicki (по макету). */
export const landingColors = {
  accent: '#7C3AED',
  accentHover: '#6D28D9',
  accentLight: '#EDE9FE',
  /** Основной почти-чёрный фон (hero, шапка, футер). */
  darkBg: '#0B0B10',
  heroBg: '#0B0B10',
  heroBgSoft: '#0B0B10',
  /** Мягкое фиолетовое свечение на hero (как в макете «Лендинг»). */
  heroGlow: 'rgba(124, 58, 237, 0.42)',
  heroGlowSoft: 'rgba(124, 58, 237, 0.14)',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textOnDark: '#F8FAFC',
  textOnDarkMuted: '#CBD5E1',
  border: '#E2E8F0',
  cardBg: '#FFFFFF',
  sectionBg: '#F8FAFC',
  footerBg: '#0B0B10',
  /** Лайм из логотипа Clicki (DESIGN_SYSTEM / logo). */
  brandGreen: '#B4D705',
  brandGreenHover: '#96AF04',
  brandGreenLight: 'rgba(180, 215, 5, 0.18)',
} as const

export const landingLayout = {
  maxWidth: 1320,
  headerHeight: 72,
  sectionPaddingY: 80,
  sectionPaddingYMobile: 48,
  containerPaddingX: 24,
} as const

export const landingRadii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const

export const landingAssets = {
  heroAnalytics: '/landing/hero-analytics.png',
  heroBidder: '/landing/hero-bidder.png',
  caseHome: '/landing/case-home.png',
  caseCosmetics: '/landing/case-cosmetics.png',
  caseClothes: '/landing/case-clothes.png',
  missionQuotes: '/landing/mission-quotes.png',
  /** Галерея «Аналитика рекламы» (?v= — сброс кеша после замены файлов). */
  galleryAnalytics: [
    '/landing/gallery/analytics/1.png?v=1',
    '/landing/gallery/analytics/2.png?v=1',
    '/landing/gallery/analytics/3.png?v=1',
    '/landing/gallery/analytics/4.png?v=1',
  ],
  /** Галерея «Автоматический запуск рекламы» / Управление РК. */
  galleryBidder: [
    '/landing/gallery/bidder/1.png?v=1',
    '/landing/gallery/bidder/2.png?v=1',
  ],
  /** Кейсы клиентов (слайды презентации). */
  cases: [
    { id: 'jeans', title: 'Джинсы', image: '/landing/cases/01-jeans.png?v=1' },
    { id: 'hooks', title: 'Крючки для полотенец', image: '/landing/cases/02-hooks.png?v=1' },
    { id: 'dress', title: 'Платье', image: '/landing/cases/03-dress.png?v=1' },
    { id: 'tshirt', title: 'Футболка', image: '/landing/cases/04-tshirt.png?v=1' },
  ],
  casesPresentationPdf: '/landing/cases-clicki.pdf',
} as const
