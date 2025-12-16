import {BUCKET_SIZE, LEAK_RATE, MAX_LIMIT, REFILL_RATE, WINDOW_SIZE_IN_SECONDS} from "../../config/constants.js";
import { redisStore } from "../server.js";
import checkfixedWindowLimit from "../logic/fixedWindow.js";
import checkSlidingWindowLimit from "../logic/slidingWindow.js";
import tokenBucket from "../logic/tokenBucket.js";
import leakyBucket from "../logic/leakyBucket.js";

const rateLimiter = async (req, res, next) => {
    const clientIdentifier = req.ip;

    // ------------- FIXED WINDOW RATE LIMITER ------------------ //
    // const fixedWindowResponse = await checkfixedWindowLimit(redisStore, clientIdentifier, MAX_LIMIT, WINDOW_SIZE_IN_SECONDS);
    //
    // res.setHeader("X-RateLimit-Limit", MAX_LIMIT);
    // res.setHeader("X-RateLimit-Remaining", fixedWindowResponse.remaining);
    // res.setHeader("X-RateLimit-Reset", fixedWindowResponse.resetTime);
    //
    // if (!fixedWindowResponse.allowed) {
    //     console.log("Rate Limiter exceeded for client: ", clientIdentifier);
    //     res.setHeader('Retry-After', fixedWindowResponse.resetTime);
    //     return res.status(429).json({
    //         error: "Too many requests",
    //         message: `Rate limit of ${MAX_LIMIT} requests per ${WINDOW_SIZE_IN_SECONDS}s exceeded`
    //     })
    // }

    // ------------- SLIDING WINDOW RATE LIMITER ---------------- //
    // const slidingWindowResponse = await checkSlidingWindowLimit(redisStore, clientIdentifier, MAX_LIMIT, WINDOW_SIZE_IN_SECONDS);
    //
    // res.setHeader("X-RateLimit-Limit", MAX_LIMIT);
    // res.setHeader("X-RateLimit-Remaining", slidingWindowResponse.remaining);
    // res.setHeader("X-RateLimit-Reset", slidingWindowResponse.resetTime);
    //
    // if (!slidingWindowResponse.allowed) {
    //     console.log("Rate Limiter exceeded for client: ", clientIdentifier);
    //     res.setHeader('Retry-After', slidingWindowResponse.resetTime);
    //     return res.status(429).json({
    //         error: "Too many requests",
    //         message: `Rate limit of ${MAX_LIMIT} requests per ${WINDOW_SIZE_IN_SECONDS}s exceeded`
    //     })
    // }

    // ----------------- TOKEN BUCKET RATE LIMITER -------------- //
    // const tokenBucketResponse = await tokenBucket(redisStore, clientIdentifier, REFILL_RATE, BUCKET_SIZE);
    //
    // res.setHeader("X-RateLimit-Limit", BUCKET_SIZE);
    // res.setHeader("X-RateLimit-Remaining", tokenBucketResponse.remaining);
    // res.setHeader("X-RateLimit-Reset", tokenBucketResponse.resetTime);
    //
    // if (!tokenBucketResponse.allowed) {
    //     console.log("Rate Limiter exceeded for client: ", clientIdentifier);
    //     res.setHeader('Retry-After', tokenBucketResponse.resetTime);
    //     return res.status(429).json({
    //         error: "Too many requests",
    //         message: `Rate limit of ${BUCKET_SIZE} requests per ${BUCKET_SIZE / REFILL_RATE}s exceeded`
    //     })
    // }

    // --------------- LEAKY BUCKET ALGORITHM ------------------- //
    const leakyBucketResponse = await leakyBucket(redisStore, clientIdentifier, LEAK_RATE, BUCKET_SIZE);

    res.setHeader("X-RateLimit-Limit", BUCKET_SIZE);
    res.setHeader("X-RateLimit-Remaining", leakyBucketResponse.remaining);
    res.setHeader("X-RateLimit-Reset", leakyBucketResponse.resetTime);

    if (!leakyBucketResponse.allowed) {
        console.log("Rate Limiter exceeded for client: ", clientIdentifier);
        res.setHeader('Retry-After', leakyBucketResponse.resetTime);
        return res.status(429).json({
            error: "Too many requests",
            message: `Rate limit of ${BUCKET_SIZE} requests per ${BUCKET_SIZE / LEAK_RATE}s exceeded`
        })
    }

    next();
}

export default rateLimiter;