const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    area: {
        type: Number,
        required: true,
        min: 0
    },

    location: {
        province: {
            type: String,
            trim: true
        },

        city: {
            type: String,
            trim: true
        },

        latitude: {
            type: Number
        },

        longitude: {
            type: Number
        }
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

const model = mongoose.model("Garden", schema);

module.exports = model;