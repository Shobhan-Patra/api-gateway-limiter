import { createProxyMiddleware } from "http-proxy-middleware";

const UPSTREAM_URL = process.env.UPSTREAM_URL;

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
    plugins: [requestLogger],
    on: {
        error: (err, req, res) => {
            console.error(`[Proxy Error] ${err.message}`);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Bad Gateway: Could not reach upstream server' }));
        }
    //     proxyReq: (proxyReq, req, res) => {
    //         console.log(`[Proxy] Proxying ${req.method} request to: ${UPSTREAM_URL}${proxyReq.path}`);
    //     },
    //     proxyRes: (proxyRes, req, res) => {
    //         console.log(`[Proxy] ProxyRes: ${proxyRes}`);
    //     },
    }
});

export default proxyMiddleware;
