import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    position: {
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        required: true,
        validate: {
            validator: (value) => !value || /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+=*$/.test(value),
            message: "Profile picture must be a supported image in base64 format."
        }
    },
    passwordHash: {
        type: String,
        select: false
    },
    passwordSalt: {
        type: String,
        select: false
    },
},
{
    timestamps: true
});

const Staff = mongoose.models.Staff || mongoose.model("Staff", staffSchema);

export default Staff;