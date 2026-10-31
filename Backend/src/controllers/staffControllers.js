
import Staff from "../models/staffModel.js";

const editableFields = ["name", "email", "position", "salary", "age", "department", "profilePicture"];

function pickEditableFields(body) {
    const source = body ?? {};
    return Object.fromEntries(editableFields
        .filter((field) => Object.hasOwn(source, field))
        .map((field) => [field, source[field]]));
}

export const createStaff = async (req, res) => {
    let staff;
    try {
        staff = await Staff.create(pickEditableFields(req.body));
    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(409).json({ message: "A staff record with this email already exists." });
        }
        throw error;
    }

    res.status(201).json(staff);
}

export const getStaff = async (req, res) => {
    const staff = req.auth.role === "admin"
        ? await Staff.find()
        : await Staff.find({ _id: req.auth.staffId });

    res.status(200).json(staff);
};

export const getStaffById = async (req, res) => {
    if (req.auth.role === "staff" && req.auth.staffId !== req.params.id) {
        return res.status(403).json({ message: "You can only view your own staff record." });
    }
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
    }

    res.status(200).json(staff);
};

export const updateStaff = async (req, res) => {
    let staff;
    try {
        staff = await Staff.findByIdAndUpdate(req.params.id, pickEditableFields(req.body), {
            new: true,
            runValidators: true
        });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(409).json({ message: "A staff record with this email already exists." });
        }
        throw error;
    }

    if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
    }

    res.status(200).json(staff);
};

export const deleteStaff = async (req, res) => {
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
    }

    res.status(200).json({ message: "Staff deleted", staff });
};
