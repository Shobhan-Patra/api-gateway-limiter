import { app } from "./app.js";
import { connectRedis } from "./store/redisStore.js";

const PORT = process.env.PORT || 8000;

async function startServer() {
    try {
        app.listen(PORT, async (req, res) => {
            await connectRedis();
            console.log(`Server listening at http://localhost:${process.env.PORT}/v1`);
        })
    } catch (error) {
        console.error(error);
    }
}

await startServer();