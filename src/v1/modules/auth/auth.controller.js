const usersModel = require("../../models/User");
const bcrypt = require('bcryptjs');
const configs = require("../../../configs");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../../utils/generateToken");
const { successResponse, errorResponse } = require("../../utils/responses")

exports.register = async (req, res, next) => {
    try {
        const { firstname, lastname, username, email, phone, password } = req.body;

        if (username) {
            const isUsernameExists = await usersModel.findOne({ username });
            if (isUsernameExists) {
                return errorResponse(res, 409, "Username already exists !");
            }
        }

        const isEmailExists = await usersModel.findOne({ email });
        if (isEmailExists) {
            return errorResponse(res, 409, "Email already exists !");
        }

        const isPhoneExists = await usersModel.findOne({ phone });
        if (isPhoneExists) {
            return errorResponse(res, 409, "Phone number already exists !");
        }

        const usersCount = await usersModel.countDocuments();
        const role = usersCount === 0 ? "ADMIN" : "USER";

        let user = usersModel({
            firstname,
            lastname,
            username,
            email,
            phone,
            password,
            role
        });

        const accessToken = generateAccessToken(user.phone);
        const refreshToken = generateRefreshToken(user.phone);

        res.cookie("access-token", accessToken, {
            httpOnly: true,
            secure: configs.node_environment === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000, // 10 min
            path: "/",
        });

        res.cookie("refresh-token", refreshToken, {
            httpOnly: true,
            secure: configs.node_environment === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: "/",
        });

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
        user.refreshToken = hashedRefreshToken;

        await user.save();

        return successResponse(res, 201, "Signed up successfully.");
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body; /// Phone number or Email address

        const user = await usersModel
            .findOne({ $or: [{ phone: identifier }, { email: identifier }] })
            .select("+password +refreshToken");
        if (!user) {
            return errorResponse(res, 401, "Invalid credentials !");
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return errorResponse(res, 401, "Invalid credentials !");
        }

        if (!user.isActive) {
            return errorResponse(res, 403, "Not allowed !")
        }

        const accessToken = generateAccessToken(user.phone);
        const refreshToken = generateRefreshToken(user.phone);

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
        user.refreshToken = hashedRefreshToken;

        await user.save();

        res.cookie("access-token", accessToken, {
            httpOnly: true,
            secure: configs.node_environment === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000, // 10 min
            path: "/",
        });

        res.cookie("refresh-token", refreshToken, {
            httpOnly: true,
            secure: configs.node_environment === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: "/",
        });

        return successResponse(res, 200, "Signed in successfully.");
    } catch (err) {
        next(err);
    }
};

exports.logout = async (req, res, next) => {
    try {
        await usersModel.findByIdAndUpdate(req.user._id, {
            $set: { refreshToken: null },
        });

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

        return successResponse(res, 200, "Signed out successfully.");
    } catch (err) {
        next(err);
    }
};

exports.refresh = async (req, res, next) => {
    try {
        const token = req.cookies["refresh-token"];
        if (!token) {
            return errorResponse(res, 401, "Login required !");
        }

        const payload = jwt.verify(token, configs.auth.refresh_secret);
        if (!payload) {
            return errorResponse(res, 401, "Login required !");
        }

        const user = await usersModel
            .findOne({ phone: payload.phone })
            .select("+refreshToken");

        if (!user.isActive) {
            return errorResponse(res, 403, "Not allowed !")
        }

        if (!user.refreshToken) {
            return errorResponse(res, 401, "Login required !");
        }

        const isMatch = await bcrypt.compare(token, user.refreshToken);
        if (!isMatch) {
            return errorResponse(res, 401, "Login required !");
        }

        const accessToken = generateAccessToken(user.phone);
        res.cookie("access-token", accessToken, {
            httpOnly: true,
            secure: configs.node_environment === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000, // 10 min
            path: "/",
        });

        return successResponse(res, 200, "Access token refreshed successfully.");
    } catch (err) {
        next(err);
    }
};

exports.showMe = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user.isActive) {
            return errorResponse(res, 403, "Not allowed !")
        }

        if (!user) {
            return errorResponse(res, 401, "Login required !");
        }

        return successResponse(res, 200, "User profile retrieved successfully.", user);
    } catch (err) {
        next(err);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await usersModel.findById(req.user._id).select("+password");

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return errorResponse(res, 401, "Incorrect password !");
        }

        const isSame = currentPassword === newPassword;
        if (isSame) {
            return errorResponse(res, 400, "New password must be different from the current password.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await usersModel.updateOne({ _id: req.user._id }, { $set: { password: hashedPassword, refreshToken: null } });

        return successResponse(res, 200, "Password changed successfully.");
    } catch (err) {
        next(err);
    }
};