import * as crypto from "node:crypto";
import {redisStore} from "../store/redisStore.js";
import {
    NUMBER_OF_API_KEYS,
    MAX_LIMIT,
    WINDOW_SIZE_IN_SECONDS,
    BUCKET_SIZE,
    REFILL_RATE, LEAK_RATE
} from "../../config/constants.js";
import {debugProxyErrorsPlugin} from "http-proxy-middleware";

const algorithms = ["fixedWindow", "slidingWindow", "tokenBucket", "leakyBucket"];


function generateApiKey() {
    const apiKey = crypto.randomBytes(64).toString('hex');

    const attributes = {
        tier: "free",
        limit: MAX_LIMIT,
        window: WINDOW_SIZE_IN_SECONDS,
        status: "active"
    }

    attributes.algorithm = algorithms[Math.floor(Math.random() * 4)]

    if (attributes.algorithm === "tokenBucket") {
        delete attributes.limit
        delete attributes.window
        attributes.bucketSize = BUCKET_SIZE;
        attributes.refillRate = REFILL_RATE;
    }

    if (attributes.algorithm === "leakyBucket") {
        delete attributes.limit
        delete attributes.window
        attributes.bucketSize = BUCKET_SIZE;
        attributes.leakRate = LEAK_RATE;
    }

    console.log(apiKey, attributes);
    return [apiKey, attributes];
}

async function populateRedisWithKeys() {

    for (let i = 0; i < NUMBER_OF_API_KEYS; i++) {
        const [apiKey, attributes] = generateApiKey();

        await redisStore.hset(`api_key:${apiKey}`, attributes);
    }
}

await populateRedisWithKeys();

await redisStore.quit();