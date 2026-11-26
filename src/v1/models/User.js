const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const schema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        trim: true
    },

    lastname: {
        type: String,
        required: true,
        trim: true
    },

    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    role: {
        type: String,
        enum: ["USER", "ADMIN"],
        default: "USER"
    },

    isActive: {
        type: Boolean,
        default: true
    },

    refreshToken: {
        type: String,
        default: null,
        select: false
    }
}, { timestamps: true });

schema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 12);
});

const model = mongoose.model("User", schema);

module.exports = model;