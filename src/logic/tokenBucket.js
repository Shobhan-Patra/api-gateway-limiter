async function tokenBucket(redisStore, key, refillRate, bucketCapacity) {
    const data = await redisStore.hGetAll(key);

    const currentTimeInMs = Date.now();

    let tokens = bucketCapacity;
    let lastRefill = currentTimeInMs;

    if (data.tokens && data.lastRefill) {
        const currentTokens  = parseFloat(data.tokens);
        const oldRefillTime = parseInt(data.lastRefill, 10);

        const elapsedTime = currentTimeInMs - oldRefillTime;
        const tokensToFill = (elapsedTime/1000) * refillRate;

        tokens = Math.min(bucketCapacity, currentTokens + tokensToFill);
        lastRefill = currentTimeInMs;
    }

    let isAllowed = false;
    if (tokens >= 1) {
        tokens -= 1;
        isAllowed = true;
    }

    await redisStore.hSet(key, {
        tokens: tokens.toString(),
        lastRefill: lastRefill.toString(),
    });

    await redisStore.expire(key, 60);

    return {
        allowed: isAllowed,
        remaining: isAllowed ? Math.floor(tokens) : 0,
        message: isAllowed ? "Request allowed" : "Too many requests",
        resetTime: isAllowed ? 0 : (1 / refillRate)
    };
}

export default tokenBucket;