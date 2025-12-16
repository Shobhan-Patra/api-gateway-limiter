async function leakyBucket(redisStore, key, leakRate, bucketCapacity) {
    const data = await redisStore.hGetAll(key);

    const currentTimeInMs = Date.now();

    let drops = 0;
    let lastLeak = currentTimeInMs;

    if (data.drops && data.lastLeak) {
        const currentTokens  = parseFloat(data.drops);
        const oldRefillTime = parseInt(data.lastLeak, 10);

        const elapsedTime = currentTimeInMs - oldRefillTime;
        const tokensToLeak = (elapsedTime/1000) * leakRate;

        drops = Math.max(0, currentTokens - tokensToLeak);
        lastLeak = currentTimeInMs;
    }

    let isAllowed = false;
    if (drops + 1 < bucketCapacity) {
        drops += 1;
        isAllowed = true;
    }

    await redisStore.hSet(key, {
        drops: drops.toString(),
        lastLeak: lastLeak.toString(),
    });

    await redisStore.expire(key, 60);

    return {
        allowed: isAllowed,
        remaining: isAllowed ? Math.floor(bucketCapacity - drops) : 0,
        message: isAllowed ? "Request allowed" : "Too many requests",
        resetTime: isAllowed ? 0 : (1 / leakRate)
    };
}

export default leakyBucket;