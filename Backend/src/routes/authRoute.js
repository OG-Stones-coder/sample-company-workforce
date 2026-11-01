import { loginLimiter } from "../middleware/rateLimiter.js";
import express from "express";
import {
    adminLogin,
    getCurrentUser,
    logout,
    staffLogin,
    staffSignup
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.post("/admin/login", loginLimiter, adminLogin);
router.post("/staff/signup", loginLimiter, staffSignup);
router.post("/staff/login", loginLimiter, staffLogin);
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", authenticate, logout);

export default router;
