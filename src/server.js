import { gateway } from "./gateway.js";
import { connectRedis } from "./store/redisStore.js";

const PORT = process.env.PORT || 8000;
let redisStore;

async function startServer() {
    try {
        gateway.listen(PORT, async () => {
            redisStore = await connectRedis();
            console.log(`Gateway listening at http://localhost:${process.env.PORT}`);
        })
    } catch (error) {
        console.error(error);
    }
}

await startServer();

export { redisStore };