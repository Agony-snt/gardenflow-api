const sensorsModel = require("../../models/Sensor");
const sensorReadingsModel = require("../../models/SensorReading");
const waterSourcesModel = require("../../models/WaterSource");
const { errorResponse, successResponse } = require("../../utils/responses");
const { isValidObjectId } = require("mongoose");

exports.getOne = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid ObjectId !");
        }

        const sensor = await sensorsModel
            .findOne({ _id: id, isActive: true })
            .populate("garden", "name owner location")
            .lean();
        if (!sensor) {
            return errorResponse(res, 404, "No water source found with is ID !");
        }

        if (req.user._id.toString() !== sensor.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        return successResponse(res, 200, "Sensor retrived successfully.", sensor);
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid ObjectId !");
        }

        const sensor = await sensorsModel.findOne({ _id: id, isActive: true }).populate("garden", "name owner location")
        if (!sensor) {
            return errorResponse(res, 404, "No water source found with is ID !");
        }

        if (req.user._id.toString() !== sensor.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        const { name } = req.body;

        const updated = await sensorsModel.findByIdAndUpdate(sensor._id, { $set: { name } }, { new: true });

        return successResponse(res, 200, "Water source updated successfully.", updated);
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid ObjectId !");
        }

        const sensor = await sensorsModel.findOne({ _id: id, isActive: true }).populate("garden", "name owner location");
        if (!sensor) {
            return errorResponse(res, 404, "No water source found with is ID !");
        }

        if (req.user._id.toString() !== sensor.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        await sensorsModel.deleteOne({ _id: sensor._id });

        return successResponse(res, 200, "Water source removed successfully.");
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

        const sensor = await sensorsModel.findById(id).populate("garden", "name owner location");
        if (!sensor) {
            return errorResponse(res, 404, "No water source found with this ID !");
        }

        if (req.user._id.toString() !== sensor.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        sensor.isActive = true;
        await sensor.save();

        return successResponse(res, 200, "Water source activated successfully.");
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

        const sensor = await sensorsModel.findById(id).populate("garden", "name owner location");
        if (!sensor) {
            return errorResponse(res, 404, "No water source found with this ID !");
        }

        if (req.user._id.toString() !== sensor.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        sensor.isActive = false;
        await sensor.save();

        return successResponse(res, 200, "Water source deactivated successfully.");
    } catch (err) {
        next(err);
    }
};

exports.showAllReadings = async (req, res, next) => {
    try {
        const { id } = req.params;


        const filter = {
            sensor: id
        };

        if (req.query.from || req.query.to) {
            filter.measuredAt = {};

            if (req.query.from) {
                const from = new Date(req.query.from);

                if (Number.isNaN(from.getTime())) {
                    return errorResponse(res, 400, "Invalid 'from' date");
                }

                filter.measuredAt.$gte = from;
            }

            if (req.query.to) {
                const to = new Date(req.query.to);

                if (Number.isNaN(to.getTime())) {
                    return errorResponse(res, 400, "Invalid 'to' date");
                }

                filter.measuredAt.$lte = to;
            }
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid objectId !");
        }

        const sensor = await sensorsModel.findById(id).populate("garden", "name owner location");
        if (!sensor) {
            return errorResponse(res, 404, "No sensor found with this ID !");
        }

        if (req.user._id.toString() !== sensor.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        const readings = await sensorReadingsModel
            .find(filter)
            .populate("sensor", "name type unit garden")
            .sort({ measuredAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        if (readings.length === 0) {
            return errorResponse(res, 404, "No readings found for this sensor !");
        }

        return successResponse(res, 200, "Sensor readings retrived successfully.", readings);
    } catch (err) {
        next(err);
    }
};

exports.addReading = async (req, res, next) => {
    try {
        const { value } = req.body;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid objectId !");
        }

        const sensor = await sensorsModel.findById(id).populate("garden", "name owner location");
        if (!sensor) {
            return errorResponse(res, 404, "No sensor found with this ID !");
        }

        if (!sensor.garden || (req.user._id.toString() !== sensor.garden.owner.toString() && req.user.role === "USER")) {
            return errorResponse(res, 403, "Not allowed !");
        }

        const sensorReading = await sensorReadingsModel.create({ sensor: sensor._id, value });

        if (sensor.type === "WATER_LEVEL") {
            await waterSourcesModel.findOneAndUpdate({ garden: sensor.garden }, { $set: { currentLevel: value } });
        }

        return successResponse(res, 201, "Sensor reading added successfully.", sensorReading);
    } catch (err) {
        next(err);
    }
};

exports.getLatestReading = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid objectId !");
        }

        const sensor = await sensorsModel.findById(id).populate("garden", "name owner location");
        if (!sensor) {
            return errorResponse(res, 404, "No sensor found with this ID !");
        }

        if (req.user._id.toString() !== sensor.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        const reading = await sensorReadingsModel
            .findOne({ sensor: sensor._id })
            .populate("sensor", "name type unit garden")
            .sort({ measuredAt: -1 });
        if (!reading) {
            return errorResponse(res, 404, "No reading found for this sensor !");
        }

        return successResponse(res, 200, "Latest reading retrived successfully.", reading);
    } catch (err) {
        next(err);
    }
};