const scheduleModel = require("../../models/WaterSourceSchedule");
const { successResponse, errorResponse } = require("../../utils/responses");
const { isValidObjectId } = require("mongoose");

exports.update = async (req, res, next) => {
    try {
        if (Object.keys(req.body).length === 0) {
            return errorResponse(res, 400, "Please provide at least one field to update.");
        }

        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid objectId !");
        }

        const isExists = await scheduleModel.findOne({ _id: id, isActive: true }).populate("garden", "name owner location");
        if (!isExists) {
            return errorResponse(res, 404, "No schedule found with this ID !");
        }

        if (req.user._id.toString() !== isExists.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        const updates = {};

        for (const item in req.body) {
            if (req.body[item] !== undefined && req.body[item] !== "") {
                updates[item] = req.body[item];

            }
        }

        if (updates.frequency && (!updates.dayOfMonth && !updates.dayOfWeek)) {
            return errorResponse(res, 400, "Day of refill must be provided !");
        }

        if (Object.keys(updates).length === 0) {
            return errorResponse(res, 400, "Please provide at least one field to update.");
        }

        const schedule = await scheduleModel
            .findOneAndUpdate({ garden: isExists.garden, isActive: true }, { $set: updates })
            .populate("garden", "name owner location")
            .lean();

        if (!schedule) {
            return errorResponse(res, 404, "No schedule found for this water source !");
        }

        if (updates.frequency === "WEEKLY") {
            await scheduleModel.updateOne({ garden: schedule.garden, isActive: true }, { $set: { dayOfMonth: null } });
        } else {
            await scheduleModel.updateOne({ garden: schedule.garden, isActive: true }, { $set: { dayOfWeek: null } });
        }

        return successResponse(res, 200, "Schedule updated successfully.", schedule);
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid objectId !");
        }

        const isExists = await scheduleModel.findOne({ _id: id, isActive: true }).populate("garden", "name owner location");
        if (!isExists) {
            return errorResponse(res, 404, "No schedule found with this ID !");
        }

        if (req.user._id.toString() !== isExists.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        await scheduleModel.findOneAndDelete({ garden: isExists.garden });

        return successResponse(res, 200, "Schedule removed successfully.");
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

        const schedule = await scheduleModel.findById(id).populate("garden", "name owner location");
        if (!schedule) {
            return errorResponse(res, 404, "No schedule found with this ID !");
        }

        if (req.user._id.toString() !== schedule.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        schedule.isActive = true;
        await schedule.save();

        return successResponse(res, 200, "Schedule activated successfully.");
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

        const schedule = await scheduleModel.findById(id).populate("garden", "name owner location");
        if (!schedule) {
            return errorResponse(res, 404, "No schedule found with this ID !");
        }

        if (req.user._id.toString() !== schedule.garden.owner.toString() && req.user.role === "USER") {
            return errorResponse(res, 403, "Not allowed !");
        }

        schedule.isActive = false;
        await schedule.save();

        return successResponse(res, 200, "Schedule deactivated successfully.");
    } catch (err) {
        next(err);
    }
};