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
        enum: [
            "AIR_TEMPERATURE",
            "SOIL_TEMPERATURE",
            "SOIL_MOISTURE",
            "WATER_LEVEL"
        ],
        required: true
    },

    unit: {
        type: String,
        enum: ["°C", "%", "L"],
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

const model = mongoose.model("Sensor", schema);

module.exports = model;