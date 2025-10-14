import express from "express";
import cors from "cors";
import cookiesParser from "cookie-parser";
import authRouter from "./routes/auth.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { config } from "./config/config.js";
import candidateRouter from "./routes/candidate.route.js";
import companyRouter from "./routes/company.route.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: config.frontend.url,
    credentials: true,
}))
app.use(cookiesParser())

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/candidate", candidateRouter)
app.use("/api/v1/company", companyRouter)

app.use(errorMiddleware)
app.get("/", (req, res) => {
    res.send("Hello, World!");
});

export default app;
