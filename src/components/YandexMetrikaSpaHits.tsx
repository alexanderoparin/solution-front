import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** ID счётчика Яндекс.Метрики (должен совпадать с init в index.html). */
export const YANDEX_METRIKA_ID = 112737634

/**
 * Отправляет hit в Яндекс.Метрику при клиентской навигации SPA
 * (первый заход уже учитывается в init с url: location.href).
 */
export default function YandexMetrikaSpaHits() {
  const location = useLocation()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (typeof window.ym !== 'function') {
      return
    }
    const url = `${location.pathname}${location.search}${location.hash}`
    window.ym(YANDEX_METRIKA_ID, 'hit', url, {
      title: document.title,
      referer: document.referrer,
    })
  }, [location.pathname, location.search, location.hash])

  return null
}
