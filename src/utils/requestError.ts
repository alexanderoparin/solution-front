import type { AxiosError } from 'axios'

/**
 * Ошибки, после которых имеет смысл автоматически повторить запрос (обрыв сети, шлюз, перегруз).
 */
export function isTransientRequestError(error: unknown): boolean {
  const err = error as AxiosError
  if (!err.response) {
    return true
  }
  const status = err.response.status
  return status === 502 || status === 503 || status === 504 || status === 429
}

/**
 * Краткое пояснение для пользователя по ошибке axios (сеть, таймаут, HTTP-код).
 */
export function getRequestFailureDescription(error: unknown): string {
  const err = error as AxiosError<unknown>
  const data = err.response?.data
  if (data && typeof data === 'object') {
    const dataObject = data as Record<string, unknown>
    if (typeof dataObject.message === 'string' && dataObject.message.trim()) {
      return dataObject.message.trim()
    }
    if (typeof dataObject.error === 'string' && dataObject.error.trim()) {
      return dataObject.error.trim()
    }

    // Ошибки валидации из Spring часто приходят как map: { fieldName: "error text" }
    const firstFieldError = Object.values(dataObject).find(
      (value) => typeof value === 'string' && value.trim(),
    ) as string | undefined
    if (firstFieldError) {
      return firstFieldError.trim()
    }
  }
  const status = err.response?.status
  if (status === 502 || status === 503 || status === 504) {
    return 'Сервер временно недоступен. Попробуйте через минуту.'
  }
  if (status === 429) {
    return 'Слишком много запросов. Подождите и нажмите «Повторить».'
  }
  if (err.code === 'ECONNABORTED') {
    return 'Превышено время ожидания ответа. Проверьте связь или отключите VPN.'
  }
  if (!err.response) {
    return 'Нет соединения с сервером. Проверьте интернет.'
  }
  return 'Проверьте интернет или попробуйте позже.'
}
