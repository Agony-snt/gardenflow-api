const usersModel = require("../../models/User");
const bcrypt = require("bcryptjs");
const configs = require("../../../configs");
const { successResponse, errorResponse } = require("../../utils/responses");
const { isValidObjectId } = require("mongoose");

exports.updateProfile = async (req, res, next) => {
    try {
        if (Object.keys(req.body).length === 0) {
            return errorResponse(res, 400, "Please provide at least one field to update.");
        }

        const allowedFields = [
            "firstname",
            "lastname",
            "username"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined && req.body[field] !== "") {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return errorResponse(res, 400, `Please provide at least one of the following fields to update: ${allowedFields.join(", ")}.`);
        }

        const user = await usersModel.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });

        return successResponse(res, 200, "User profile updated successfully.", user);
    } catch (err) {
        next(err);
    }
};

exports.removeProfile = async (req, res, next) => {
    try {
        const { password } = req.body;

        if (!password) {
            return errorResponse(res, 400, "Password is required to remove the account.");
        }

        const user = await usersModel.findById(req.user._id).select("+password");

        if (!user) {
            return errorResponse(res, 404, "User not found.");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return errorResponse(res, 401, "Incorrect password");
        }

        await usersModel.findByIdAndDelete(req.user._id);

        res.clearCookie("access-token", {
            httpOnly: true,
            secure: configs.node_environment === "production",
            sameSite: "lax",
            path: "/",
        });

        res.clearCookie("refresh-token", {
            httpOnly: true,
            secure: configs.node_environment === "production",
            sameSite: "lax",
            path: "/",
        });

        return successResponse(res, 200, "Account removed successfully.");
    } catch (err) {
        next(err);
    }
};

exports.getAll = async (req, res, next) => {
    try {
        const users = await usersModel.find({}).lean();

        return successResponse(res, 200, "Users retrieved successfully.", users);
    } catch (err) {
        next(err);
    }
};

exports.getOne = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid objectId !");
        }

        const user = await usersModel.findById(id);
        if (!user) {
            return errorResponse(res, 404, "No user found with this Id !");
        }

        return successResponse(res, 200, "User retrieved successfully.", user);
    } catch (err) {
        next(err);
    }
};

exports.updateOne = async (req, res, next) => {
    try {
        if (Object.keys(req.body).length === 0) {
            return errorResponse(res, 400, "Please provide at least one field to update.");
        }

        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid objectId !");
        }

        const updates = {};

        for (const item in req.body) {
            if (req.body[item] !== undefined && req.body[item] !== "") {
                updates[item] = req.body[item];

            }
        }

        const user = await usersModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
        if (!user) {
            return errorResponse(res, 404, "No user found with this Id !");
        }

        return successResponse(res, 200, "User data updated successfully.", user);
    } catch (err) {
        next(err);
    }
};

exports.removeOne = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid objectId !");
        }

        const user = await usersModel.findByIdAndDelete(id);
        if (!user) {
            return errorResponse(res, 404, "No user found with this Id !");
        }

        return successResponse(res, 200, "User removed successfully.");
    } catch (err) {
        next(err);
    }
};

exports.activate = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid objectId !");
        }

        const user = await usersModel.findByIdAndUpdate(id, { $set: { isActive: true } });
        if (!user) {
            return errorResponse(res, 404, "No user found with this Id !");
        }

        return successResponse(res, 200, "User activated successfully.");
    } catch (err) {
        next(err);
    }
};

exports.deactivate = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid objectId !");
        }

        const user = await usersModel.findByIdAndUpdate(id, { $set: { isActive: false } });
        if (!user) {
            return errorResponse(res, 404, "No user found with this Id !");
        }

        return successResponse(res, 200, "User deactivated successfully.");
    } catch (err) {
        next(err);
    }
};
