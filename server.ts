import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5000;

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