import express from 'express';

const PORT = 5000;
const app = express();

app.use(express.json());

app.set('trust proxy', true);

const checkGateway = async (req, res, next) => {
    const secret = req.headers['x-gateway-secret'];
    if (secret !== process.env.GATEWAY_SECRET) {
        return res.status(403).json({error: 'Direct access forbidden; Use gateway'});
    }
    next();
}

app.use(checkGateway);

app.get('/test', (req, res) => {
    console.log(`\n--- Incoming Request to Backend ---`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log(`Headers:`, req.headers['x-gateway-secret'] ? 'Secret Verified ✅' : 'No Secret ❌');
    console.log(`Body:`, req.body);

    res.json({
        message: 'Hello from Backend!',
        receivedHeaders: {
            'x-forwarded-for': req.headers['x-forwarded-for'],
            'x-gateway-secret': req.headers['x-gateway-secret']
        },
        receivedBody: req.body
    });
});

app.post('/testpost', (req, res) => {
    console.log(`\n--- Incoming Request to Backend ---`);
    console.log(`\n--- Incoming Request to Backend ---`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log(`Headers:`, req.headers['x-gateway-secret'] ? 'Secret Verified ✅' : 'No Secret ❌');
    console.log(`Body:`, req.body);

    res.json({
        message: 'Testing POST requests',
        receivedHeaders: {
            'x-forwarded-for': req.headers['x-forwarded-for'],
            'x-gateway-secret': req.headers['x-gateway-secret']
        },
        receivedBody: req.body
    });
})

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:5000/healthcheck`);
})
