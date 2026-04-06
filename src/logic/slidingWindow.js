const slidingWindowLimit = `
    local currentTimeInMs = tonumber(ARGV[1])
    local windowSizeInMs = tonumber(ARGV[2]) * 1000
    local maxRequests = tonumber(ARGV[3])
    local windowStartTime = currentTimeInMs - windowSizeInMs
    
    -- Remove old requests
    redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', windowStartTime)
    -- Add current request
    redis.call('ZADD', KEYS[1], currentTimeInMs, currentTimeInMs)
    -- Count requests in window
    local count = redis.call('ZCARD', KEYS[1])
    -- Get earliest request
    local earliestRequest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
    
    local isAllowed = count < maxRequests
    local remaining = 0
    
    if not isAllowed then
        if #earliestRequest > 0 then
            local earliestTime = tonumber(earliestRequest[2])
            remaining = math.max(0, math.floor(((earliestTime - currentTimeInMs) + windowSizeInMs) / 1000))
        end
    end
    
    return {
        isAllowed and 1 or 0,
        isAllowed and (maxRequests - count) or 0,
        remaining
    }
`;

async function checkSlidingWindowLimit(redisStore, key, MAX_REQUESTS, WINDOW_SIZE_IN_SECONDS) {
    const currentTimeInMs = Date.now();

    const [isAllowed, remaining, resetTime] = await redisStore.eval(
        slidingWindowLimit,
        1,
        key,
        currentTimeInMs,
        WINDOW_SIZE_IN_SECONDS,
        MAX_REQUESTS
    );

    return {
        allowed: isAllowed === 1,
        remaining: remaining,
        message: isAllowed === 1 ? "Request allowed" : "Too many requests",
        resetTime: `${resetTime} seconds`
    };
}

export default checkSlidingWindowLimit;