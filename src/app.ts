import express from "express";
import cors from "cors";
import cookiesParser from "cookie-parser";
import authRouter from "./routes/auth.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}))
app.use(cookiesParser())

app.use("/api/v1/auth", authRouter)

app.use(errorMiddleware)
app.get("/", (req, res) => {
    res.send("Hello, World!");
});

export default app;
