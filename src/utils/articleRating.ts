/** Рейтинг по отзывам WB (1–5); 0 и null — «нет рейтинга». */
export function hasMeaningfulArticleRating(rating: number | null | undefined): boolean {
  return rating != null && rating > 0
}

export function formatArticleRating(rating: number | null | undefined): string | null {
  if (!hasMeaningfulArticleRating(rating)) return null
  return Number(rating).toFixed(1)
}
