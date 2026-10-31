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

router.post("/admin/login", adminLogin);
router.post("/staff/signup", staffSignup);
router.post("/staff/login", staffLogin);
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", authenticate, logout);

export default router;
