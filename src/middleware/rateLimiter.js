import {redisStore} from "../store/redisStore.js";
import checkfixedWindowLimit from "../logic/fixedWindow.js";
import checkSlidingWindowLimit from "../logic/slidingWindow.js";
import tokenBucket from "../logic/tokenBucket.js";
import leakyBucket from "../logic/leakyBucket.js";

const rateLimiter = async (req, res, next) => {
    const startTime = Date.now();
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
        return res.status(400).json({
            status: 400,
            message: "Missing API key"
        });
    }

    const rateLimitConfig = await redisStore.hgetall(`api_key:${apiKey}`);
    if (!rateLimitConfig || rateLimitConfig.status !== "active") {
        return res.status(403).json({
            status: 403,
            message: "Invalid API Key"
        });
    }

    const rateLimiterType = rateLimitConfig.algorithm || "fixedWindow";
    let rateLimiterResult = {}

    const key = `rate-limit:${rateLimiterType}:${apiKey}`;

    switch (rateLimiterType) {
        case "slidingWindow":
            rateLimiterResult = await checkSlidingWindowLimit(redisStore, key, rateLimitConfig);
            break;
        case "tokenBucket":
            rateLimiterResult = await tokenBucket(redisStore, key, rateLimitConfig);
            break;
        case "leakyBucket":
            rateLimiterResult = await leakyBucket(redisStore, key, rateLimitConfig);
            break;
        default:
            rateLimiterResult = await checkfixedWindowLimit(redisStore, key, rateLimitConfig);
            break;
    }

    res.setHeader("X-RateLimit-Limit", rateLimitConfig.limit || rateLimitConfig.bucketSize);
    res.setHeader("X-RateLimit-Remaining", rateLimiterResult.remaining);
    res.setHeader("X-RateLimit-Reset", rateLimiterResult.resetTime);

    req.headers['x-ratelimit-type'] = rateLimiterType;

    if (!rateLimiterResult.allowed) {
        console.log("Rate Limiter exceeded for client: ", apiKey);
        res.setHeader('Retry-After', rateLimiterResult.resetTime);

        let message;
        if (rateLimitConfig.algorithm === "fixedWindow" || rateLimitConfig.algorithm === "slidingWindow") {
            message = `Rate limit of ${rateLimitConfig.limit} requests per ${rateLimitConfig.window}s exceeded`
        }
        else {
            message = `Bucket exhausted; Bucket size: ${rateLimitConfig.bucketSize}, Refill/Leak Rate: ${rateLimitConfig.refillRate || rateLimitConfig.leakRate}/s`;
        }

        return res.status(429).json({
            error: "Too many requests",
            message: message
        })
    }

    const duration = Date.now() - startTime;
    res.setHeader("X-Redis-Time", duration);
    console.log("Rate limiter logic takes ", duration, "ms");

    next();
}

export default rateLimiter;