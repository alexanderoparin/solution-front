/**
 * Ограничивает параллельные загрузки превью вариантов А/Б через API.
 * Без лимита браузер открывает пачку запросов → Tomcat/Hikari забиваются и сайт зависает.
 */
const MAX_CONCURRENT = 2

let active = 0
const waiting: Array<() => void> = []

function pump(): void {
  while (active < MAX_CONCURRENT && waiting.length > 0) {
    const next = waiting.shift()
    if (next) {
      next()
    }
  }
}

export function enqueueAbTestImageLoad<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      active += 1
      task()
        .then(resolve, reject)
        .finally(() => {
          active -= 1
          pump()
        })
    }
    waiting.push(run)
    pump()
  })
}
