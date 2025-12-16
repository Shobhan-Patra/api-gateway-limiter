import checkfixedWindowLimit from "../logic/fixedWindow.js";
import {MAX_LIMIT, WINDOW_SIZE_IN_SECONDS} from "../../config/constants.js";
import { redisStore } from "../server.js";
import checkSlidingWindowLimit from "../logic/slidingWindow.js";

const rateLimiter = async (req, res, next) => {
    const clientIdentifier = req.ip;

    // ------------- FIXED WINDOW RATE LIMITER ---------------- //
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
    const slidingWindowResponse = await checkSlidingWindowLimit(redisStore, clientIdentifier, MAX_LIMIT, WINDOW_SIZE_IN_SECONDS);

    res.setHeader("X-RateLimit-Limit", MAX_LIMIT);
    res.setHeader("X-RateLimit-Remaining", slidingWindowResponse.remaining);
    res.setHeader("X-RateLimit-Reset", slidingWindowResponse.resetTime);

    if (!slidingWindowResponse.allowed) {
        console.log("Rate Limiter exceeded for client: ", clientIdentifier);
        res.setHeader('Retry-After', slidingWindowResponse.resetTime);
        return res.status(429).json({
            error: "Too many requests",
            message: `Rate limit of ${MAX_LIMIT} requests per ${WINDOW_SIZE_IN_SECONDS}s exceeded`
        })
    }

    next();
}

export default rateLimiter;