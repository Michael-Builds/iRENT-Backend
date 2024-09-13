import { redis } from "./redis.js";

// Set data in cache with dynamic TTL
export const setCache = async (key, value, ttl) => {
    try {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        await redis.set(key, serializedValue, 'EX', ttl);
    } catch (error) {
        console.error(`Cache set error for key: ${key}`, error);
    }
}

// Clear specific cache key
export const clearCache = async (key) => {
    try {
        await redis.del(key);
    } catch (error) {
        console.error(`Cache clear error for key: ${key}`, error);
    }
}
