import express from "express";
import cors from "cors";
import cookiesParser from "cookie-parser";
import authRouter from "./routes/auth.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { config } from "./config/config.js";
import candidateRouter from "./routes/candidate.route.js";
import companyRouter from "./routes/company.route.js";
import uploadRouter from "./routes/upload.route.js";
import jobRouter from "./routes/job.route.js";
import interviewRouter from "./routes/interview.route.js";
import chatRouter from "./routes/chat.route.js";

import messageRouter from "./routes/message.route.js";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [config.frontend.url!, config.frontend.dockerUrl!, config.frontend.prodDevUrl!],
    credentials: true,
  }),
);
app.use(cookiesParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/candidate", candidateRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/interview", interviewRouter);
app.use("/api/v1/chat", chatRouter);

app.use("/api/v1/message", messageRouter);
app.use(errorMiddleware);
app.get("/", (req, res) => {
  res.send("Hello, World! This is Hiregenix Backend.");
});

export default app;
