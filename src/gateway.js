import express from "express";
import {ApiResponse} from "./utils/ApiResponse.js";
import {ApiError} from "./utils/ApiError.js";
import rateLimiter from "./middleware/rateLimiter.js";
import circuitBreaker from "./middleware/circuitBreaker.js";
import proxyMiddleware from "./middleware/proxyHandler.js";

const gateway = express();

const totalTimeLogger = async (req, res, next) => {
    const start = process.hrtime();

    const originalWriteHead = res.writeHead;
    res.writeHead = function (...args) {
        const diff = process.hrtime(start);
        const totalTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

        res.setHeader("X-Gateway-Total-Time", `${totalTime}ms`);

        return originalWriteHead.apply(this, args);
    }
    next();
}

gateway.use(totalTimeLogger);
gateway.use('/api', circuitBreaker);
gateway.use('/api', rateLimiter);
gateway.use('/api', proxyMiddleware);

gateway.use(express.json());
gateway.use(express.urlencoded());

gateway.get("/test", (req, res) => {
    const message = {
        "Received request from IP: ": req.ip,
        "To Test Rate limiting: ": "Send Requests to /api/test",
    }
    res.status(200).json(new ApiResponse(200, message, "Success"));
})

gateway.get('/healthcheck', (req, res) => {
    res.status(200).json(new ApiResponse(200, "Gateway working fine!"));
})

gateway.use((req, res) => {
    res.status(404).json(new ApiError(400, 'Not Found or Proxy Target Unavailable'));
});

export {gateway};