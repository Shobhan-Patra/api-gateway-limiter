import { createProxyMiddleware } from "http-proxy-middleware";
import HttpAgent, {HttpsAgent} from "agentkeepalive";

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
        error: (err, req, res) => {
            console.error(`[Proxy Error] ${err.message}`);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Bad Gateway: Could not reach upstream server' }));
        },
        proxyReq: (proxyReq, req, res) => {
            // console.log(`[Proxy] Proxying ${req.method} request to: ${UPSTREAM_URL}${proxyReq.path}`);
            req.upstreamStart = process.hrtime();
        },
        proxyRes: (proxyRes, req, res) => {
            if (req.upstreamStart) {
                const diff = process.hrtime(req.upstreamStart);
                const upstreamTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
                res.setHeader("X-Upstream-Time", `${upstreamTime}ms`);

                console.log(`[Proxy] Upstream Latency: ${upstreamTime}ms`);
            }
        },
    }
});

export default proxyMiddleware;
