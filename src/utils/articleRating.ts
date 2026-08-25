/** Рейтинг по отзывам WB (1–5); 0 и null — «нет рейтинга». */
export function hasMeaningfulArticleRating(rating: number | null | undefined): boolean {
  return rating != null && rating > 0
}

export function formatArticleRating(rating: number | null | undefined): string | null {
  if (!hasMeaningfulArticleRating(rating)) return null
  return Number(rating).toFixed(1)
}

/** Контент-рейтинг Ozon: 0–100 баллов; 0 и null — «нет данных». */
export const OZON_CONTENT_RATING_MAX = 100

export function formatOzonContentRating(rating: number | null | undefined): string | null {
  if (!hasMeaningfulArticleRating(rating)) return null
  return Number(rating).toFixed(1)
}

/** Цвет «звезды» по уровню контент-рейтинга Ozon. */
export function getOzonContentRatingColor(rating: number): string {
  if (rating >= 80) return '#22C55E'
  if (rating >= 50) return '#FBBF24'
  return '#EF4444'
}

export function ozonContentRatingTooltip(rating: number | null | undefined): string {
  const formatted = formatOzonContentRating(rating)
  if (!formatted) return `Контент-рейтинг Ozon (0–${OZON_CONTENT_RATING_MAX})`
  return `Контент-рейтинг Ozon: ${formatted} из ${OZON_CONTENT_RATING_MAX}`
}
