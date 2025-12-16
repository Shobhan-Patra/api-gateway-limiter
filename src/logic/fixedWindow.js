import {WINDOW_SIZE_IN_SECONDS} from "../../config/constants.js";

async function checkAndIncrement(redisStore, key) {
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

async function checkfixedWindowLimit(redisStore, key, MAX_REQUESTS, WINDOW_SIZE_IN_SECONDS) {
    const nowInSeconds = Math.floor(Date.now() / 1000);

    const windowStartTime = Math.floor(nowInSeconds / WINDOW_SIZE_IN_SECONDS) * WINDOW_SIZE_IN_SECONDS;

    const windowKey = `${key}:${windowStartTime}`;

    const {count, remaining} = await checkAndIncrement(redisStore, windowKey);

    const isAllowed = count <= MAX_REQUESTS;

    return {
        allowed: isAllowed,
        remaining: isAllowed ? MAX_REQUESTS - count : 0,
        message: isAllowed ? "Request allowed" : "Too many requests",
        resetTime: `${remaining} seconds`
    }
}

export default checkfixedWindowLimit;