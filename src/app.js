import express from "express";
import {ApiResponse} from "./utils/ApiResponse.js";
import {ApiError} from "./utils/ApiError.js";
import rateLimiter from "./middleware/rateLimiter.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded());
app.use(rateLimiter);

app.get("/test", (req, res) => {
    res.status(200).json(new ApiResponse(200, req.ip));
})

app.get('/v1/healthcheck', (req, res) => {
    res.status(200).json(new ApiResponse(200, "Server working fine!"));
})

app.use((req, res) => {
    res.status(404).json(new ApiError(400, 'Not Found or Proxy Target Unavailable'));
});

export {app};