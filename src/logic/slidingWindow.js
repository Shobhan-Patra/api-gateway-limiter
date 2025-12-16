async function checkSlidingWindowLimit(redisStore, key, MAX_REQUESTS, WINDOW_SIZE_IN_SECONDS) {
    const currentTimeInMs = Date.now();
    const windowStartTime = currentTimeInMs - WINDOW_SIZE_IN_SECONDS * 1000;

    const multi = redisStore.multi();
    multi.zRemRangeByScore(key, '-inf', windowStartTime);
    multi.zAdd(key, {score: currentTimeInMs, value:currentTimeInMs.toString()});
    multi.zCard(key);
    multi.zRange(key, 0, 0, 'WITHSCORES');
    const result = await multi.exec();

    const count = result[2];
    const earliestRequest = result[3];

    const isAllowed = count < MAX_REQUESTS;

    let remaining = Math.max(0, Math.floor(((earliestRequest[0] - currentTimeInMs) + WINDOW_SIZE_IN_SECONDS * 1000) / 1000));

    return {
        allowed: isAllowed,
        remaining: isAllowed ? MAX_REQUESTS - count : 0,
        message: isAllowed ? "Request allowed" : "Too many requests",
        resetTime: `${remaining} seconds`
    };
}

export default checkSlidingWindowLimit;