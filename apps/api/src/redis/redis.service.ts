import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  public client: Redis

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379')
    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    })

    this.client.on('error', (err) => {
      this.logger.warn(`Redis connection error: ${err.message}`)
    })

    this.client.on('connect', () => {
      this.logger.log('Redis connected')
    })
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit()
  }

  gymKey(gymId: string, suffix: string): string {
    return `gym:${gymId}:${suffix}`
  }

  async getOrSet<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    try {
      const cached = await this.client.get(key)
      if (cached) {
        return JSON.parse(cached) as T
      }
    } catch {
      // Redis unavailable — fall through to compute
    }

    const result = await fn()

    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(result))
    } catch {
      // Redis unavailable — return result without caching
    }

    return result
  }

  async invalidate(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch {
      // Best-effort invalidation
    }
  }
}
