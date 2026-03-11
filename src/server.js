import { gateway } from "./gateway.js";
import { connectRedis } from "./store/redisStore.js";

const PORT = process.env.PORT || 8000;
let redisStore;

async function startServer() {
    try {
        redisStore = await connectRedis();
        console.log("Redis store started");

        gateway.listen(PORT, async () => {
            console.log(`Gateway listening at http://localhost:${PORT}`);
        })
    } catch (error) {
        console.error(error);
    }
}

await startServer();

export { redisStore };