import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config();
const PORT = process.env.PORT || 8000;

app.listen(PORT, (req, res) => {
    console.log(`Server listening at http://localhost:${process.env.PORT}/api/v1`);
})