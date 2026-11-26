const gardensModel = require("../models/Garden");
const { isValidObjectId } = require("mongoose")
const { errorResponse } = require("../utils/responses");

exports.isGardenOwner = async (req, res, next) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return errorResponse(res, 400, "Invalid objectId !");
    }

    if (req.user.role === "ADMIN") {
        const garden = await gardensModel.findById(id).populate("owner", "firstname lastname email phone").lean();
        if (!garden) {
            return errorResponse(res, 404, "No garden found with this Id !");
        }

        req.garden = garden;

        return next();
    }

    const garden = await gardensModel.findOne({
        _id: id,
        owner: req.user._id
    }).populate("owner", "firstname lastname email phone").lean();

    if (!garden) {
        return errorResponse(res, 404, "Garden not found");
    }

    req.garden = garden;

    next();
};