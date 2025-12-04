// Константы стилей для страниц аналитики

export const colors = {
  // Основные цвета
  primary: '#7C3AED',
  primaryHover: '#6D28D9',
  primaryLight: '#EDE9FE',
  
  // Текст
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  
  // Фоны
  bgWhite: '#FFFFFF',
  bgGray: '#F8FAFC',
  bgGrayLight: '#F1F5F9',
  
  // Метрики
  funnelBg: '#E0F2FE',
  funnelBgHover: '#BAE6FD',
  advertisingBg: '#D1FAE5',
  advertisingBgHover: '#A7F3D0',
  
  // Статусы
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  
  // Границы
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
}

export const typography = {
  // Заголовки
  h1: {
    fontSize: '32px',
    fontWeight: 700,
    lineHeight: 1.2,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: 1.3,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1.4,
    color: colors.textPrimary,
  },
  
  // Текст
  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.5,
    color: colors.textSecondary,
  },
  
  // Числа (моноширинный)
  number: {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    fontSize: '14px',
    fontWeight: 500,
  },
}

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
}

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
}

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
}

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
}

export const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1400px',
}

// Медиа-запросы для адаптивности
export const media = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (max-width: ${breakpoints.desktop})`,
}

