import { executeSlidingWindowTransaction} from "../store/redisStore.js";

async function checkSlidingWindowLimit(key, MAX_REQUESTS, WINDOW_SIZE_IN_SECONDS) {
    const currentTimeInMs = Date.now();
    const windowStartTime = currentTimeInMs - WINDOW_SIZE_IN_SECONDS * 1000;

    const windowKey = `rate_limit:${key}`;

    const result = await executeSlidingWindowTransaction(windowKey, currentTimeInMs, windowStartTime);

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