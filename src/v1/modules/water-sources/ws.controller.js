const waterSourcesModel = require("../../models/WaterSource");
const scheduleModel = require("../../models/WaterSourceSchedule");
const { errorResponse, successResponse } = require("../../utils/responses");
const { isValidObjectId } = require("mongoose");

exports.getOne = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid ObjectId !");
        }

        const waterSource = await waterSourcesModel
            .findOne({ _id: id, isActive: true })
            .populate("garden", "name owner location")
            .lean();
        if (!waterSource) {
            return errorResponse(res, 404, "No water source found with is ID !");
        }

        if (req.user._id.toString() !== waterSource.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        return successResponse(res, 200, "Water source retrived successfully.", waterSource);
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

        const waterSource = await waterSourcesModel.findOne({ _id: id, isActive: true }).populate("garden", "name owner location");
        if (!waterSource) {
            return errorResponse(res, 404, "No water source found with is ID !");
        }

        if (req.user._id.toString() !== waterSource.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        const { name } = req.body;

        const updated = await waterSourcesModel.findByIdAndUpdate(waterSource._id, { $set: { name } }, { new: true });

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

        const waterSource = await waterSourcesModel.findOne({ _id: id, isActive: true }).populate("garden", "name owner location");
        if (!waterSource) {
            return errorResponse(res, 404, "No water source found with is ID !");
        }

        if (req.user._id.toString() !== waterSource.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        await waterSourcesModel.deleteOne({ _id: waterSource._id });

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

        const waterSource = await waterSourcesModel.findById(id).populate("garden", "name owner location");
        if (!waterSource) {
            return errorResponse(res, 404, "No water source found with this ID !");
        }

        if (req.user._id.toString() !== waterSource.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        waterSource.isActive = true;
        await waterSource.save();

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

        const waterSource = await waterSourcesModel.findById(id).populate("garden", "name owner location");
        if (!waterSource) {
            return errorResponse(res, 404, "No water source found with this ID !");
        }

        if (req.user._id.toString() !== waterSource.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        waterSource.isActive = false;
        await waterSource.save();

        return successResponse(res, 200, "Water source deactivated successfully.");
    } catch (err) {
        next(err);
    }
};

exports.showSchedule = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid objectId !");
        }

        const waterSource = await waterSourcesModel.findById(id).populate("garden", "name owner location");
        if (!waterSource) {
            return errorResponse(res, 404, "No water source found with this ID !");
        }

        if (req.user._id.toString() !== waterSource.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        const schedule = await scheduleModel
            .findOne({ garden: waterSource.garden, isActive: true })
            .populate("garden", "name owner location")
            .lean();

        if (!schedule) {
            return errorResponse(res, 404, "No active schedule found for this water source !");
        }

        return successResponse(res, 200, "Schedule retrieved succeessfully.", schedule);
    } catch (err) {
        next(err);
    }
};

exports.createSchedule = async (req, res, next) => {
    try {
        const {
            frequency,
            dayOfWeek,
            dayOfMonth,
            startTime // 24 hours format
        } = req.body;

        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid objectId !");
        }

        const waterSource = await waterSourcesModel.findById(id).populate("garden", "name owner location");
        if (!waterSource) {
            return errorResponse(res, 404, "No water source found with this ID !");
        }

        if (req.user._id.toString() !== waterSource.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        const isExists = await scheduleModel.findOne({ garden: waterSource.garden, isActive: true });
        if (isExists) {
            return errorResponse(res, 409, "A schedule already been added !");
        }

        let schedule;
        if (frequency === "WEEKLY") {
            schedule = await scheduleModel.create({ garden: waterSource.garden, frequency, dayOfWeek, startTime });
        } else if (frequency === "MONTHLY") {
            schedule = await scheduleModel.create({ garden: waterSource.garden, frequency, dayOfMonth, startTime });
        } else {
            return errorResponse(res, 400, "Invalid frequency !");
        }

        return successResponse(res, 201, "Schedule added successfully.", schedule);
    } catch (err) {
        next(err);
    }
};