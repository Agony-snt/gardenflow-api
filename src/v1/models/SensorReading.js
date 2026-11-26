const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    sensor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sensor",
        required: true
    },

    value: {
        type: Number,
        required: true
    },

    measuredAt: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

const model = mongoose.model("Sensor-Reading", schema);

module.exports = model;