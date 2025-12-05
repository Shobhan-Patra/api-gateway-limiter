import express from "express";
import dotenv from "dotenv";
import {ApiResponse} from "./utils/ApiResponse.js";

const app = express();
dotenv.config();

app.use(express.json());
app.use(express.urlencoded());

app.get('/api/v1/healthcheck', (req, res) => {
    res.status(200).json(new ApiResponse(200, "Server working fine!"));
})

export {app};