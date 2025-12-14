import { gateway } from "./gateway.js";
import { connectRedis } from "./store/redisStore.js";

const PORT = process.env.PORT || 8000;

async function startServer() {
    try {
        gateway.listen(PORT, async () => {
            await connectRedis();
            console.log(`Gateway listening at http://localhost:${process.env.PORT}/v1`);
        })
    } catch (error) {
        console.error(error);
    }
}

await startServer();