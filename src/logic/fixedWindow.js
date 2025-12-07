import { checkAndIncrement } from "../store/redisStore.js";

async function checkfixedWindowLimit(key, MAX_REQUESTS, WINDOW_SIZE_IN_SECONDS) {
    const nowInSeconds = Math.floor(Date.now() / 1000);

    const windowStartTime = Math.floor(nowInSeconds / WINDOW_SIZE_IN_SECONDS) * WINDOW_SIZE_IN_SECONDS;

    const windowKey = `${key}:${windowStartTime}`;

    const {count, remaining} = await checkAndIncrement(windowKey);

    const isAllowed = count <= MAX_REQUESTS;

    return {
        allowed: isAllowed,
        remaining: isAllowed ? MAX_REQUESTS - count : 0,
        message: isAllowed ? "Request allowed" : "Too many requests",
        resetTime: `${remaining} seconds`
    }
}

export default checkfixedWindowLimit;