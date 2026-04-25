async function tokenBucket(redisStore, key, rateLimitConfig) {
    const data = await redisStore.hgetall(key);

    const currentTimeInMs = Date.now();

    let tokens = rateLimitConfig.bucketSize;
    let lastRefill = currentTimeInMs;

    if (data.tokens && data.lastRefill) {
        const currentTokens  = parseFloat(data.tokens);
        const oldRefillTime = parseInt(data.lastRefill, 10);

        const elapsedTime = currentTimeInMs - oldRefillTime;
        const tokensToFill = (elapsedTime/1000) * rateLimitConfig.refillRate;

        tokens = Math.min(rateLimitConfig.bucketSize, currentTokens + tokensToFill);
        lastRefill = currentTimeInMs;
    }

    let isAllowed = false;
    if (tokens >= 1) {
        tokens -= 1;
        isAllowed = true;
    }

    await redisStore.hset(key, {
        tokens: tokens.toString(),
        lastRefill: lastRefill.toString(),
    });

    await redisStore.expire(key, 60);

    return {
        allowed: isAllowed,
        remaining: isAllowed ? Math.floor(tokens) : 0,
        message: isAllowed ? "Request allowed" : "Too many requests",
        resetTime: isAllowed ? 0 : (1 / rateLimitConfig.refillRate)
    };
}

export default tokenBucket;