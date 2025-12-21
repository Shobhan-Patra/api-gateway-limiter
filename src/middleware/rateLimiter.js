import {BUCKET_SIZE, LEAK_RATE, MAX_LIMIT, REFILL_RATE, WINDOW_SIZE_IN_SECONDS} from "../../config/constants.js";
import { redisStore } from "../server.js";
import checkfixedWindowLimit from "../logic/fixedWindow.js";
import checkSlidingWindowLimit from "../logic/slidingWindow.js";
import tokenBucket from "../logic/tokenBucket.js";
import leakyBucket from "../logic/leakyBucket.js";

const rateLimiter = async (req, res, next) => {
    const startTime = Date.now();
    const clientIdentifier = req.ip;

    const rateLimiterType = req.headers['x-ratelimit-type'] ?? "fixedWindow";
    let rateLimiterResult = {}

    const key = `rate-limit:${rateLimiterType}:${clientIdentifier}`;

    switch (rateLimiterType) {
        case "slidingWindow":
            // ------------- SLIDING WINDOW RATE LIMITER ---------------- //
            rateLimiterResult = await checkSlidingWindowLimit(redisStore, key, MAX_LIMIT, WINDOW_SIZE_IN_SECONDS);
            rateLimiterResult.maxLimit = MAX_LIMIT;
            rateLimiterResult.windowSize = WINDOW_SIZE_IN_SECONDS;
            break;
        case "tokenBucket":
            // ----------------- TOKEN BUCKET RATE LIMITER -------------- //
            rateLimiterResult = await tokenBucket(redisStore, key, REFILL_RATE, BUCKET_SIZE);
            rateLimiterResult.maxLimit = BUCKET_SIZE;
            rateLimiterResult.windowSize = BUCKET_SIZE / REFILL_RATE;
            break;
        case "leakyBucket":
            // --------------- LEAKY BUCKET ALGORITHM ------------------- //
            rateLimiterResult = await leakyBucket(redisStore, key, LEAK_RATE, BUCKET_SIZE);
            rateLimiterResult.maxLimit = BUCKET_SIZE;
            rateLimiterResult.windowSize = BUCKET_SIZE / LEAK_RATE;
            break;
        default:
            // ------------- FIXED WINDOW RATE LIMITER ------------------ //
            rateLimiterResult = await checkfixedWindowLimit(redisStore, key, MAX_LIMIT, WINDOW_SIZE_IN_SECONDS);
            rateLimiterResult.maxLimit = MAX_LIMIT;
            rateLimiterResult.windowSize = WINDOW_SIZE_IN_SECONDS;
            break;
    }

    res.setHeader("X-RateLimit-Limit", rateLimiterResult.maxLimit);
    res.setHeader("X-RateLimit-Remaining", rateLimiterResult.remaining);
    res.setHeader("X-RateLimit-Reset", rateLimiterResult.resetTime);

    req.headers['x-ratelimit-type'] = rateLimiterType;

    if (!rateLimiterResult.allowed) {
        console.log("Rate Limiter exceeded for client: ", clientIdentifier);
        res.setHeader('Retry-After', rateLimiterResult.resetTime);
        return res.status(429).json({
            error: "Too many requests",
            message: `Rate limit of ${rateLimiterResult.maxLimit} requests per ${rateLimiterResult.windowSize}s exceeded`
        })
    }

    const duration = Date.now() - startTime;
    res.setHeader("X-Redis-Time", duration);
    console.log("Rate limiter logic takes ", duration, "ms");

    next();
}

export default rateLimiter;