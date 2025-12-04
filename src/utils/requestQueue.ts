/**
 * Очередь запросов с ограничением параллелизма
 */
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private running = 0
  private maxConcurrent: number
  private delayBetweenRequests: number

  constructor(maxConcurrent: number = 2, delayBetweenRequests: number = 200) {
    this.maxConcurrent = maxConcurrent
    this.delayBetweenRequests = delayBetweenRequests
  }

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.running++
    const request = this.queue.shift()
    
    if (request) {
      try {
        await request()
        // Задержка между запросами
        if (this.delayBetweenRequests > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests))
        }
      } catch (error) {
        // Ошибка уже обработана в request
      } finally {
        this.running--
        this.process()
      }
    } else {
      this.running--
    }
  }

  clear() {
    this.queue = []
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getRunningCount(): number {
    return this.running
  }
}

// Создаем глобальную очередь для метрик аналитики
export const analyticsRequestQueue = new RequestQueue(2, 200)

