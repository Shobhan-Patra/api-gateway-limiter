import { createProxyMiddleware } from "http-proxy-middleware";
import HttpAgent, {HttpsAgent} from "agentkeepalive";
import {redisStore} from "../server.js";
import {
    CIRCUIT_FAILURE_THRESHOLD, CIRCUIT_TIMEOUT,
    REDIS_UPSTREAM_FAILURE_COUNT_KEY,
    REDIS_UPSTREAM_STATUS_KEY
} from "../../config/constants.js";

const UPSTREAM_URL = process.env.UPSTREAM_URL;
const isHttps = UPSTREAM_URL.startsWith("https");

const agentOptions = {
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000,
    freeSocketTimeout: 30000,
};

const keepAliveAgent = isHttps ? new HttpsAgent(agentOptions) : new HttpAgent(agentOptions);

function requestLogger(proxyServer, _) {
    proxyServer.on('proxyReq', (proxyReq, req, _) => {
        console.log(`[Proxy] Proxying ${req.method} request to: ${UPSTREAM_URL}${proxyReq.path}`);
    })
}

const proxyMiddleware = createProxyMiddleware({
    // logger: console,
    target: UPSTREAM_URL,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: {
        '^/api': '',
    },
    headers: {
        'X-Gateway-Secret': process.env.GATEWAY_SECRET,
    },
    agent: keepAliveAgent,
    plugins: [requestLogger],

    on: {
        error: async (err, req, res) => {
            console.error(`[Proxy Error] ${err.message}`);

            const currentFailureCount = await redisStore.incr(REDIS_UPSTREAM_FAILURE_COUNT_KEY);
            if (currentFailureCount > CIRCUIT_FAILURE_THRESHOLD) {
                const isUpstreamOpen = await redisStore.get(REDIS_UPSTREAM_STATUS_KEY);
                if (isUpstreamOpen !== "false") {
                    await redisStore.set(REDIS_UPSTREAM_STATUS_KEY, "false", {
                        EX: CIRCUIT_TIMEOUT
                    });
                    console.warn(`[CIRCUIT BREAKER] Circuit tripped opened, blocking all requests for the next ${CIRCUIT_TIMEOUT}s`);
                }
            }

            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Service Unavailable: Could not reach upstream server' }));
        },
        proxyReq: (proxyReq, req, res) => {
            req.upstreamStart = process.hrtime();
        },
        proxyRes: async (proxyRes, req, res) => {
            if (req.upstreamStart) {
                const diff = process.hrtime(req.upstreamStart);
                const upstreamTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
                res.setHeader("X-Upstream-Time", `${upstreamTime}ms`);

                // Upstream server is working fine if the gateway is receiving responses from upstream
                await redisStore.set(REDIS_UPSTREAM_STATUS_KEY, "true");
                await redisStore.set(REDIS_UPSTREAM_FAILURE_COUNT_KEY, 0);
                console.log("Circuit breaker reset successfully");

                console.log(`[Proxy] Upstream Latency: ${upstreamTime}ms`);
            }
        },
    }
});

export default proxyMiddleware;
