const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    garden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garden",
        required: true
    },

    frequency: {
        type: String,
        enum: [
            "WEEKLY",
            "MONTHLY"
        ],
        required: true
    },

    dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
        default: null
    },

    dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
        default: null
    },

    startTime: {
        type: String,
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

const model = mongoose.model("Water-Source-Schedule", schema);

module.exports = model;