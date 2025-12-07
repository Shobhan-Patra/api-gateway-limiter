import { createClient } from 'redis';
import { performance } from 'perf_hooks'
import {WINDOW_SIZE_IN_SECONDS} from '../../config/constants.js';

const redisStore = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    }
});
redisStore.on('error', err => console.log('Redis Client Error', err));

async function connectRedis() {
    if (!redisStore.isOpen) {
        try {
            await redisStore.connect();
            console.log('Redis Client Connected');
        } catch (error) {
            console.error("Error connecting to Redis Client: ", error);
        }
    }
    return redisStore;
}

async function closeRedis() {
    if (redisStore.isOpen) {
        try {
            await redisStore.quit();
            console.log('Redis Client Disconnected');
        } catch (error) {
            console.error("Error disconnecting to Redis Client: ", error);
        }
    }

}

async function measureRedisFetchLatency() {
    const startTime = performance.now();

    await redisStore.set('key', 'value');
    const value = await redisStore.get('key');
    await redisStore.hSet('user-session:123', {
        name: 'John',
        surname: 'Smith',
        company: 'Redis',
        age: 29
    })
    let userSession = await redisStore.hGetAll('user-session:123');

    const stopTime = performance.now();
    console.log(value);
    console.log(JSON.stringify(userSession, null, 2));
    console.log(`Fetch duration: ${(stopTime - startTime).toFixed(3)} ms`);
}

async function checkAndIncrement(key) {
    const redisStore = await connectRedis();

    const count = await redisStore.incr(key);

    if (count === 1) {
        await redisStore.expire(key, WINDOW_SIZE_IN_SECONDS);
    }

    const ttl = await redisStore.ttl(key);

    return {
        count: count,
        remaining: ttl
    }
}

async function executeSlidingWindowTransaction(key, currentTimeInMs, windowStartTime) {
    const redisStore = await connectRedis();

    const multi = redisStore.multi();
    multi.zRemRangeByScore(key, '-inf', windowStartTime);
    multi.zAdd(key, {score: currentTimeInMs, value:currentTimeInMs.toString()});
    multi.zCard(key);
    multi.zRange(key, 0, 0, 'WITHSCORES');
    const result = await multi.exec();
    return result;
}

export { redisStore, connectRedis, closeRedis, checkAndIncrement, executeSlidingWindowTransaction };
