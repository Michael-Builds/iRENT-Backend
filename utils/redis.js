import Redis from "ioredis";
import { REDIS_URL } from "../config/index.js";
import colors from 'colors';

const createRedisClient = () => {
    if (!REDIS_URL) {
        throw new Error(colors.bgRed.white(`Redis connection failed: REDIS_URL is not defined`));
    }

    try {
        // console.log(colors.bgMagenta.white(`Connecting to Redis at ${REDIS_URL}`));
        const client = new Redis(REDIS_URL);

        client.on('error', (err) => {
            console.error(colors.bgRed.white(`Redis connection error: ${err.message}`));
        });

        client.on('connect', () => {
            console.log(colors.bgMagenta.white(`Connected to Redis!`));
        });

        return client;
    } catch (err) {
        console.error(colors.bgRed.white(`Failed to create Redis client: ${err.message}`));
        throw err;
    }
}
export const redis = createRedisClient();