import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import Session from "../models/sessionModel.js";
import Staff from "../models/staffModel.js";

const scryptAsync = promisify(scrypt);
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const PASSWORD_LENGTH = 64;

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function matchesSecret(value, expected) {
    const actualBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length
        && timingSafeEqual(actualBuffer, expectedBuffer);
}

async function createSession(role, staffId) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await Session.create({
        tokenHash: createHash("sha256").update(token).digest("hex"),
        role,
        staffId,
        expiresAt
    });
    return { token, expiresAt };
}

async function hashPassword(password, salt) {
    return (await scryptAsync(password, salt, PASSWORD_LENGTH)).toString("hex");
}

export const adminLogin = async (req, res) => {
    const { username, password } = req.body ?? {};
    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedUsername || !expectedPassword || expectedPassword.length < 12) {
        return res.status(503).json({
            message: "Admin login is not configured. Set ADMIN_USERNAME and an ADMIN_PASSWORD of at least 12 characters in the backend environment."
        });
    }
    if (!isNonEmptyString(username) || typeof password !== "string"
        || !matchesSecret(username, expectedUsername)
        || !matchesSecret(password, expectedPassword)) {
        return res.status(401).json({ message: "Invalid username or password." });
    }

    const session = await createSession("admin");
    res.status(200).json({
        ...session,
        user: { role: "admin", username: expectedUsername }
    });
};

export const staffSignup = async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const { password } = req.body ?? {};
    if (!email || typeof password !== "string" || password.length < 12 || password.length > 128) {
        return res.status(400).json({
            message: "Enter your work email and a password between 12 and 128 characters."
        });
    }

    const staff = await Staff.findOne({ email }).select("+passwordHash +passwordSalt");
    if (!staff) {
        return res.status(403).json({
            message: "No staff record matches that work email. Ask your administrator to add or update your record."
        });
    }
    if (staff.passwordHash) {
        return res.status(409).json({
            message: "An account already exists for this work email. Please log in."
        });
    }

    const passwordSalt = randomBytes(16).toString("hex");
    const passwordHash = await hashPassword(password, passwordSalt);
    const updatedStaff = await Staff.findOneAndUpdate(
        { _id: staff._id, passwordHash: { $exists: false } },
        { $set: { passwordSalt, passwordHash } },
        { new: true, runValidators: true }
    );
    if (!updatedStaff) {
        return res.status(409).json({
            message: "An account already exists for this work email. Please log in."
        });
    }

    const session = await createSession("staff", updatedStaff._id);
    res.status(201).json({
        ...session,
        user: { role: "staff", id: updatedStaff._id, name: updatedStaff.name, email: updatedStaff.email }
    });
};

export const staffLogin = async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const { password } = req.body ?? {};
    if (!email || typeof password !== "string" || password.length > 128) {
        return res.status(400).json({ message: "Enter your work email and password." });
    }

    const staff = await Staff.findOne({ email }).select("+passwordHash +passwordSalt");
    if (!staff?.passwordHash || !staff.passwordSalt) {
        return res.status(401).json({ message: "Invalid work email or password." });
    }

    const submittedHash = Buffer.from(await hashPassword(password, staff.passwordSalt), "hex");
    const storedHash = Buffer.from(staff.passwordHash, "hex");
    if (submittedHash.length !== storedHash.length || !timingSafeEqual(submittedHash, storedHash)) {
        return res.status(401).json({ message: "Invalid work email or password." });
    }

    const session = await createSession("staff", staff._id);
    res.status(200).json({
        ...session,
        user: { role: "staff", id: staff._id, name: staff.name, email: staff.email }
    });
};

export const getCurrentUser = async (req, res) => {
    if (req.auth.role === "admin") {
        return res.status(200).json({
            user: { role: "admin", username: process.env.ADMIN_USERNAME }
        });
    }

    const staff = await Staff.findById(req.auth.staffId);
    if (!staff) {
        await Session.findByIdAndDelete(req.sessionId);
        return res.status(401).json({ message: "This staff account is no longer active." });
    }

    res.status(200).json({
        user: { role: "staff", id: staff._id, name: staff.name, email: staff.email }
    });
};

export const logout = async (req, res) => {
    await Session.findByIdAndDelete(req.sessionId);
    res.status(200).json({ message: "Logged out." });
};
