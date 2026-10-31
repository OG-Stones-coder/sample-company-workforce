import { createHash } from "node:crypto";
import Session from "../models/sessionModel.js";

export const authenticate = async (req, res, next) => {
    const token = req.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) {
        return res.status(401).json({ message: "Please log in to continue." });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const session = await Session.findOne({
        tokenHash,
        expiresAt: { $gt: new Date() }
    });

    if (!session) {
        return res.status(401).json({ message: "Your session has expired. Please log in again." });
    }

    req.auth = {
        role: session.role,
        staffId: session.staffId?.toString()
    };
    req.sessionId = session._id;
    next();
};

export const requireAdmin = (req, res, next) => {
    if (req.auth?.role !== "admin") {
        return res.status(403).json({ message: "Administrator access is required." });
    }
    next();
};
