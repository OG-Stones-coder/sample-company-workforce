import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    tokenHash: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ["admin", "staff"],
        required: true
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
        required: function () {
            return this.role === "staff";
        }
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 0
    }
}, {
    timestamps: true
});

const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);

export default Session;
