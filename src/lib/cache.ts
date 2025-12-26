import { Redis } from '@upstash/redis';
import logger from './logger';

const redis = new Redis({
    url: process.env.REDIS_URL || '',
    token: process.env.REDIS_TOKEN || '',
});

export async function cacheData(key: string, data: any, ttl: number = 3600) {
    try {
        await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
        logger.error('Cache set error:', error);
    }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data as string) as T : null;
    } catch (error) {
        logger.error('Cache get error:', error);
        return null;
    }
}

export async function invalidateCache(key: string) {
    try {
        await redis.del(key);
    } catch (error) {
        logger.error('Cache invalidate error:', error);
    }
}