import app from "./app.js";
import { config } from "./config/config.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import connectToRabbitMQ from "./config/rabbitmq.js";
import { connectToQdrant } from "./config/qdrant.js";
dotenv.config();

const PORT = config.port

// connectToRabbitMQ().catch((err) => {
//     console.error("Failed to connect to RabbitMQ", err);
//     process.exit(1);
// });

export const qdrantClient = connectToQdrant()

connectDB()
    .then(() => {
        app.on("error", (err) => {
            console.error("Server error:", err);
        });
        app.listen(PORT, () => {
            console.log(`Server is running on port http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to the database", err);
        process.exit(1);
    });
