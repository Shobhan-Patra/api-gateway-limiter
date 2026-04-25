const luaScript = `
    local current = redis.call('INCR', KEYS[1])
    if current == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    local ttl = redis.call('TTL', KEYS[1])
    return {current, ttl}
`;

async function checkfixedWindowLimit(redisStore, key, rateLimitConfig) {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const windowStartTime = Math.floor(nowInSeconds / rateLimitConfig.window) * rateLimitConfig.window;
    const windowKey = `${key}:${windowStartTime}`;

    const [count, ttl] = await redisStore.eval(luaScript, 1, windowKey, rateLimitConfig.window);

    const isAllowed = count <= rateLimitConfig.limit;

    return {
        allowed: isAllowed,
        remaining: isAllowed ? rateLimitConfig.limit - count : 0,
        message: isAllowed ? "Request allowed" : "Too many requests",
        resetTime: `${ttl} seconds`
    }
}

export default checkfixedWindowLimit;