import { gateway } from "./gateway.js";

const PORT = process.env.PORT || 8000;

async function startServer() {
    try {
        gateway.listen(PORT, async () => {
            console.log(`Gateway listening at http://localhost:${PORT}`);
        })
    } catch (error) {
        console.error(error);
    }
}

await startServer();