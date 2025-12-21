import { createClient } from 'redis';
import { performance } from 'perf_hooks'

const redisStore = createClient({
    url: process.env.REDIS_URL,
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
    const redisStore = await connectRedis();
    const startTime = performance.now();

    await redisStore.set('key', 'value');
    const value = await redisStore.get('key');
    // await redisStore.hSet('user-session:123', {
    //     name: 'John',
    //     surname: 'Smith',
    //     company: 'Redis',
    //     age: 29
    // })
    // let userSession = await redisStore.hGetAll('user-session:123');

    const stopTime = performance.now();
    console.log(value);
    // console.log(JSON.stringify(userSession, null, 2));
    console.log(`Fetch duration: ${(stopTime - startTime).toFixed(3)} ms`);
}

// await measureRedisFetchLatency();

export { redisStore, connectRedis, closeRedis };
