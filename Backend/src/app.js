import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoute.js";
import staffRoutes from "./routes/staffRoute.js";


const app = express();

app.use(express.json({ limit: "3mb" }));
app.use(cors());



app.get("/", (req, res) => {
    res.send("Welcome to my site")
});

app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes)
export default app;