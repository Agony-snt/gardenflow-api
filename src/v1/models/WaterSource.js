const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    garden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garden",
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    type: {
        type: String,
        enum: ["POOL", "TANK"],
        required: true
    },

    capacity: {
        type: Number,
        required: true,
        min: 0
    },

    currentLevel: {
        type: Number,
        default: 0,
        min: 0
    },

    minimumLevel: {
        type: Number,
        required: true,
        min: 0
    },

    criticalLevel: {
        type: Number,
        required: true,
        min: 0
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

const model = mongoose.model("Water-Source", schema);

module.exports = model;