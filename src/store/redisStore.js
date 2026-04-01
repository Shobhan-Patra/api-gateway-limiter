import {Redis} from 'ioredis';

const redisStore = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
});

redisStore.on('error', err => {
    console.error(`[FATAL] Redis Client Error: ${err.message}`);
    console.error("Shutting down the API Gateway because Redis is unreachable.");
    // Fail fast strategy
    process.exit(1);
});

redisStore.on('connect', () => {
    console.log(`[REDIS] Client Connected`);
})

export { redisStore };
