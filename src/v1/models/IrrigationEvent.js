const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    garden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garden",
        required: true
    },

    waterSource: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Water-Source",
        required: true
    },

    startedAt: {
        type: Date,
        default: null
    },

    endedAt: {
        type: Date,
        default: null
    },

    duration: {
        type: Number,
        default: 0,
        min: 0
    },

    waterAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    trigger: {
        type: String,
        enum: [
            "AUTOMATIC",
            "MANUAL"
        ],
        required: true
    },

    status: {
        type: String,
        enum: [
            "RUNNING",
            "COMPLETED",
            "FAILED",
            "CANCELLED"
        ],
        default: "RUNNING"
    }

}, { timestamps: true });

const model = mongoose.model("Irrigation-Event", schema);

module.exports = model;