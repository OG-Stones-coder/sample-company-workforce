import express from "express"
import { createStaff, deleteStaff, getStaff, getStaffById, updateStaff } from "../controllers/staffControllers.js";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";



const router = express.Router();

router.use(authenticate);
router.post("/", requireAdmin, createStaff);
router.get("/", getStaff);
router.get("/:id", getStaffById);
router.patch("/:id", requireAdmin, updateStaff);
router.delete("/:id", requireAdmin, deleteStaff);

export default router;