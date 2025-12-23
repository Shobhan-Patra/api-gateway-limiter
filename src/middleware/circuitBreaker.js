import {redisStore} from "../server.js";
import {REDIS_UPSTREAM_STATUS_KEY} from "../../config/constants.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const circuitBreaker = asyncHandler(async (req, res, next) => {
    const isUpstreamOpen = await redisStore.get(REDIS_UPSTREAM_STATUS_KEY);

    if (isUpstreamOpen === "false") {

        const ttl = await redisStore.ttl(REDIS_UPSTREAM_STATUS_KEY);
        res.setHeader('Retry-After', ttl);

        return res.status(503).json({
            error: "Upstream server is down (Circuit is tripped open), Try again after 30s",
            retryAfter: ttl
        });
    }

    next();
})

export default circuitBreaker;