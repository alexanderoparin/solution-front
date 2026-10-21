/** Слово «день/дня/дней» по числу. */
export function campaignManageDaysWord(n: number): string {
  const abs = Math.abs(n)
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня'
  return 'дней'
}

/** Склонение «N дней» для подписки на Управление РК. */
export function campaignManageDaysLabel(n: number): string {
  return `${n} ${campaignManageDaysWord(n)}`
}

/**
 * «Остался 1 день» / «Осталось 2 дня» / «Осталось 5 дней».
 * Для 0 и меньше — «Осталось менее дня».
 */
export function campaignManageDaysRemainingPhrase(n: number): string {
  if (n <= 0) return 'Осталось менее дня'
  const mod10 = n % 10
  const mod100 = n % 100
  const verb = mod10 === 1 && mod100 !== 11 ? 'Остался' : 'Осталось'
  return `${verb} ${campaignManageDaysLabel(n)}`
}
