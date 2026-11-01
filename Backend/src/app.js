import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoute.js";
import staffRoutes from "./routes/staffRoute.js";


const app = express();

app.use(express.json({ limit: "3mb" }));
app.use(cors({
    origin: "https://og-stones-coder.github.io"
}));



app.get("/", (req, res) => {
    res.send("Welcome to my site")
});

app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);

app.use((err, req, res, next) => {
    console.error("Server error:", err);

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.status || err.statusCode || 500;

    res.status(statusCode).json({
        message: statusCode >= 500
            ? "An unexpected server error occurred."
            : err.message
    });
});
export default app;