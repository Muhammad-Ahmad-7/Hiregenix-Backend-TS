import http from "http";
import app from "./app.js";
import { config } from "./config/config.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import { connectToQdrant } from "./config/qdrant.js";
import connectToRabbitMQ from "./config/rabbitmq.js";
import interviewReminderJob from "./cron/interviewCron.js";
import { initializeSocket } from "./utils/socket.js";
import jobDeadlinePassedJob from "./cron/jobDeadlinePassedCron.js";

dotenv.config();

const PORT = config.port;
const server = http.createServer(app);
initializeSocket(server);
connectToRabbitMQ().catch((err) => {
  console.error("Failed to connect to RabbitMQ", err);
  process.exit(1);
});

export const qdrantClient = connectToQdrant();

// ---> Cron jobs

// Start the interview reminder job
interviewReminderJob();

// Start the job deadline passed job
jobDeadlinePassedJob();

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to the database:", err);
    process.exit(1);
  });

server.on("error", (err) => {
  console.error("Server error:", err);
});
