import express from "express";
import {ApiResponse} from "./utils/ApiResponse.js";
import {ApiError} from "./utils/ApiError.js";
import rateLimiter from "./middleware/rateLimiter.js";
import proxyMiddleware from "./middleware/proxyHandler.js";

const gateway = express();

gateway.use('/api', rateLimiter);
gateway.use('/api', proxyMiddleware);

gateway.use(express.json());
gateway.use(express.urlencoded());

gateway.get("/test", (req, res) => {
    res.status(200).json(new ApiResponse(200, req.ip));
})

gateway.get('/healthcheck', (req, res) => {
    res.status(200).json(new ApiResponse(200, "Gateway working fine!"));
})

gateway.use((req, res) => {
    res.status(404).json(new ApiError(400, 'Not Found or Proxy Target Unavailable'));
});

export {gateway};