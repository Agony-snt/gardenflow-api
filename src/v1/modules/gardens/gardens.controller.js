const gardensModel = require("../../models/Garden");
const usersModel = require("../../models/User");
const waterSourcesModel = require('../../models/WaterSource');
const sensorsModel = require("../../models/Sensor");
const sensorReadingsModel = require("../../models/SensorReading");
const scheduleModel = require("../../models/WaterSourceSchedule");
const irrigationEventModel = require("../../models/IrrigationEvent");
const irrigationService = require("./services/irrigation.service");
const { errorResponse, successResponse } = require("../../utils/responses");
const { isValidObjectId } = require("mongoose")

exports.getAll = async (req, res, next) => {
    try {
        if (req.user.role === "ADMIN") {
            const gardens = await gardensModel.find({})
                .populate("owner", "firstname lastname username phone")
                .lean();
            if (gardens.length === 0) {
                return errorResponse(res, 404, "No garden found on system !");
            }

            return successResponse(res, 200, "All gardens retrived successfully.", gardens);
        }

        const userGardens = await gardensModel.find({ owner: req.user._id, isActive: true })
            .populate("owner", "firstname lastname username phone")
            .lean();
        if (userGardens.length === 0) {
            return errorResponse(res, 404, "No garden found !");
        }

        return successResponse(res, 200, "User gardens retrieved successfully.", userGardens);
    } catch (err) {
        next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { name, area, province, city, latitude, longitude } = req.body;

        const isExists = await gardensModel.findOne({ name, owner: req.user._id });
        if (isExists) {
            return errorResponse(res, 409, "Garden with this name already exists !");
        }

        const garden = await gardensModel.create({ name, owner: req.user._id, area, location: { province, city, latitude, longitude } });

        return successResponse(res, 201, "Garden created successfully.", garden);
    } catch (err) {
        next(err);
    }
};

exports.getOne = async (req, res, next) => {
    try {
        return successResponse(res, 200, "Garden retrived successfully.", req.garden);
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        if (Object.keys(req.body).length === 0) {
            return errorResponse(res, 400, "Please provide at least one field to update.");
        }

        const updates = {};

        for (const item in req.body) {
            if (req.body[item] !== undefined && req.body[item] !== "") {
                updates[item] = req.body[item];

            }
        }

        const updatedGarden = await gardensModel.findByIdAndUpdate(req.garden._id, { $set: updates }, { new: true }).lean();

        return successResponse(res, 200, "Garden updated successfully.", updatedGarden);
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const gardenId = req.garden._id;

        await gardensModel.deleteOne({ _id: gardenId });

        return successResponse(res, 200, "Garden removed successfully.");
    } catch (err) {
        next(err);
    }
};

exports.activate = async (req, res, next) => {
    try {
        const garden = await gardensModel.findByIdAndUpdate(req.garden._id, { $set: { isActive: true } });
        if (!garden) {
            return errorResponse(res, 404, "No garden found with this ID !");
        }

        return successResponse(res, 200, "Garden activated successfully.");
    } catch (err) {
        next(err);
    }
};

exports.deactivate = async (req, res, next) => {
    try {
        const garden = await gardensModel.findByIdAndUpdate(req.garden._id, { $set: { isActive: false } });
        if (!garden) {
            return errorResponse(res, 404, "No garden found with this ID !");
        }

        return successResponse(res, 200, "Garden deactivated successfully.");
    } catch (err) {
        next(err);
    }
};

exports.changeOwner = async (req, res, next) => {
    try {
        const { newOwnerId } = req.body;
        const { id } = req.params;

        if (!isValidObjectId(newOwnerId)) {
            return errorResponse(res, 400, "Invalid userId !");
        }

        if (!isValidObjectId(id)) {
            return errorResponse(res, 400, "Invalid gardenId !");
        }

        const user = await usersModel.findById(newOwnerId);
        if (!user) {
            return errorResponse(res, 404, "No user found with this ID !");
        }

        const garden = await gardensModel
            .findByIdAndUpdate(id, { $set: { owner: newOwnerId } }, { new: true })
            .populate("owner", "firstname lastname username phone")
            .lean();
        if (!garden) {
            return errorResponse(res, 404, "No garden found with this ID !");
        }

        return successResponse(res, 200, "Garden owner changed successfully.", garden);
    } catch (err) {
        next(err);
    }
};

exports.getAllUserGardens = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!isValidObjectId(userId)) {
            return errorResponse(res, 400, "Invalid ObjectId !");
        }

        const user = await usersModel.findById(userId);
        if (!user) {
            return errorResponse(res, 404, "No user found with this ID !");
        }

        const userGardens = await gardensModel.find({ owner: user._id }).lean();
        if (userGardens.length === 0) {
            return errorResponse(res, 404, "User has no gardens !");
        }

        return successResponse(res, 200, "User's Gardens retrived successfully.", userGardens);
    } catch (err) {
        next(err);
    }
};

exports.dashboard = async (req, res, next) => {
    try {
        const { id } = req.params;

        ////* Get garden *////
        const garden = req.garden;

        ////* Get active water source *////
        const waterSource = await waterSourcesModel.findOne({ garden: id, isActive: true }).lean();
        if (!waterSource) {
            return errorResponse(res, 404, "No active water source found !");
        }

        ////* Get active water source schedule *////
        const waterSourceSchedule = await scheduleModel.findOne({ garden: id, isActive: true }).lean();
        if (!waterSourceSchedule) {
            return errorResponse(res, 404, "No active schedule for water source found !");
        }

        ////* Get active sensors *////
        const sensors = await sensorsModel.find({ garden: id, isActive: true }).lean();
        if (sensors.length === 0) {
            return errorResponse(res, 404, "No active sensor found !");
        }

        ////* Get latest reading for each sensor *////
        const sensorData = {};

        for (const sensor of sensors) {
            const latestReading = await sensorReadingsModel
                .findOne({ sensor: sensor._id })
                .sort({ measuredAt: -1 })
                .lean();

            if (!latestReading) {
                sensorData[sensor.type] = {
                    value: null,
                    unit: sensor.unit,
                    measuredAt: null,
                    status: "NO_READING"
                };

                continue;
            }

            const readingAge = Date.now() - new Date(latestReading.measuredAt).getTime();

            const isFresh = readingAge <= 30 * 60 * 1000;

            sensorData[sensor.type] = {
                value: latestReading.value,
                unit: sensor.unit,
                measuredAt: latestReading.measuredAt,
                status: isFresh ? "OK" : "STALE"
            };
        }

        ////* Calculate water source status *////
        const currentWaterLevel = waterSource.currentLevel ?? 0;

        const waterPercentage = waterSource.capacity > 0
            ? (currentWaterLevel / waterSource.capacity) * 100
            : 0;

        let waterStatus = "NORMAL";

        if (currentWaterLevel <= waterSource.criticalLevel) {
            waterStatus = "CRITICAL";
        } else if (currentWaterLevel <= waterSource.minimumLevel) {
            waterStatus = "LOW";
        }

        const usableWater = Math.max(currentWaterLevel - waterSource.criticalLevel, 0);

        ////* Get last irrigation *////
        const lastIrrigation = await irrigationEventModel
            .findOne({ garden: id })
            .sort({ startedAt: -1 })
            .lean();

        ////* Get recent 5 irrigations *////
        const recentIrrigations = await irrigationEventModel
            .find({ garden: id })
            .sort({ startedAt: -1 })
            .limit(5)
            .lean();

        ////* Get last irrigation *////
        const runningIrrigation = await irrigationEventModel
            .findOne({ garden: id, status: "RUNNING" })
            .sort({ startedAt: -1 })
            .lean();

        const irrigationStatus = runningIrrigation ? "RUNNING" : "IDLE";

        ////* Get irrigation decision *////
        let decision = null;

        try {
            decision = await irrigationService.decision(id);
        } catch (err) {
            decision = {
                shouldIrrigate: false,
                reason: "DECISION_UNAVAILABLE"
            };
        }

        ////* Next refill *////
        let nextRefill = null;

        if (waterSourceSchedule) {
            nextRefill = calculateNextRefill(
                waterSourceSchedule,
                new Date()
            );
        }

        let remainingSeconds = null;

        if (nextRefill) {
            remainingSeconds = Math.max(
                Math.floor(
                    (nextRefill.getTime() - Date.now()) / 1000
                ), 0
            );
        }

        ////* Dashboard response *////
        return successResponse(res, 200, "Garden dashboard retrieved successfully.",
            {
                garden: {
                    id: garden._id,
                    name: garden.name,
                    area: garden.area,
                    isActive: garden.isActive
                },

                waterSource: {
                    id: waterSource._id,
                    name: waterSource.name,
                    type: waterSource.type,

                    currentLevel: currentWaterLevel,

                    capacity: waterSource.capacity,

                    percentage: Number(waterPercentage.toFixed(2)),

                    minimumLevel: waterSource.minimumLevel,

                    criticalLevel: waterSource.criticalLevel,

                    usableWater,

                    status: waterStatus
                },

                nextRefill: {
                    date: nextRefill,
                    remainingSeconds
                },

                sensors: sensorData,

                irrigation: {
                    status: irrigationStatus,

                    currentEvent: runningIrrigation,

                    lastEvent: lastIrrigation,

                    recentEvents: recentIrrigations
                },

                decision
            }
        )
    } catch (err) {
        next(err);
    }
};

exports.createWaterSource = async (req, res, next) => {
    try {
        const { name, type, capacity } = req.body;

        const waterSource = await waterSourcesModel.findOne({ name, garden: req.garden._id });
        if (waterSource) {
            return errorResponse(res, 409, "A water source with this data already exists in garden !");
        }

        const minimumLevel = capacity * 0.2;
        const criticalLevel = capacity * 0.1;

        const createdWaterSource = await waterSourcesModel.create({ garden: req.garden._id, name, type, capacity, minimumLevel, criticalLevel });

        return successResponse(res, 201, "Water source added successfully.", createdWaterSource);
    } catch (err) {
        next(err);
    }
};

exports.getSensors = async (req, res, next) => {
    try {
        const sensors = await sensorsModel.find({ garden: req.garden._id, isActive: true });
        if (sensors.length === 0) {
            return errorResponse(res, 404, "No sensors found for this garden !");
        }

        return successResponse(res, 200, "Sensors retrived successfully.", sensors);
    } catch (err) {
        next(err);
    }
};

exports.createSensor = async (req, res, next) => {
    try {
        const { name, type } = req.body;

        const unit = { AIR_TEMPERATURE: "°C", SOIL_TEMPERATURE: "°C", SOIL_MOISTURE: "%", WATER_LEVEL: "L" }[type];

        const isExists = await sensorsModel.findOne({ name, garden: req.garden._id });
        if (isExists) {
            return errorResponse(res, 409, "Sensor with this name already exists !");
        }

        const sensor = await sensorsModel.create({ garden: req.garden._id, name, type, unit });

        return successResponse(res, 201, "Sensor added successfully.", sensor);
    } catch (err) {
        next(err);
    }
};

exports.getIrrigationStatus = async (req, res, next) => {
    try {
        const event = await irrigationEventModel
            .findOne({ garden: req.garden._id, })
            .sort({ startedAt: -1 })
            .populate("garden", "name owner.username location")
            .populate("waterSource", "name type capacity currentLevel minimumLevel criticalLevel")
            .lean();

        if (!event) {
            return errorResponse(res, 404, "No irrigation events found for this garden");
        }

        return successResponse(res, 200, "Irrigation lastes status retrived successfully.", {
            event,
            status: event.status
        })

    } catch (err) {
        next(err);
    }
};

exports.getIrrigationDecision = async (req, res, next) => {
    try {
        const result = await irrigationService.decision(req.garden._id);

        if (result.shouldIrrigate === true) {
            const runningEvent = await irrigationEventModel.findOne({
                garden: req.garden._id,
                status: "RUNNING"
            });

            if (runningEvent) {
                return errorResponse(res, 409, "Irrigation is already running.");
            }

            const waterSource = await waterSourcesModel.findOne({
                garden: req.garden._id,
                isActive: true
            });

            if (!waterSource) {
                return errorResponse(res, 404, "No active water source found.");
            }

            if (waterSource.currentLevel <= waterSource.criticalLevel) {
                return errorResponse(res, 400, "Water level is too low to start irrigation.");
            }

            const event = await irrigationEventModel.create({
                garden: req.garden._id,
                waterSource: waterSource._id,
                startedAt: new Date(),
                trigger: "AUTOMATIC",
                status: "RUNNING",
                duration: 0,
                waterAmount: result.water.estimatedWaterAmount
            });

            return successResponse(res, 200, "Irrigation decision calculated and started irrigation successfully.", { result, event });
        }

        return successResponse(res, 200, "Irrigation decision calculated successfully.", result);
    } catch (err) {
        next(err);
    }
};

exports.startIrrigation = async (req, res, next) => {
    try {
        const runningEvent = await irrigationEventModel.findOne({
            garden: req.garden._id,
            status: "RUNNING"
        });

        if (runningEvent) {
            return errorResponse(res, 409, "Irrigation is already running.");
        }

        const waterSource = await waterSourcesModel.findOne({
            garden: req.garden._id,
            isActive: true
        });

        if (!waterSource) {
            return errorResponse(res, 404, "No active water source found.");
        }

        if (waterSource.currentLevel <= waterSource.criticalLevel) {
            return errorResponse(res, 400, "Water level is too low to start irrigation.");
        }

        const result = await irrigationService.decision(req.garden._id);

        if (!result.shouldIrrigate) {
            return errorResponse(res, 400, "Irrigation should not start for following reason.", result.reason);
        }

        const event = await irrigationEventModel.create({
            garden: req.garden._id,
            waterSource: waterSource._id,
            startedAt: new Date(),
            trigger: "MANUAL",
            status: "RUNNING",
            duration: 0,
            waterAmount: result.water.estimatedWaterAmount
        });

        return successResponse(res, 201, "Irrigation started successfully", event);
    } catch (err) {
        next(err);
    }
};

exports.stopIrrigation = async (req, res, next) => {
    try {
        const { isComplete } = req.body;

        const runningEvent = await irrigationEventModel.findOne({
            garden: req.garden._id,
            status: "RUNNING"
        });

        if (!runningEvent) {
            return errorResponse(res, 404, "No running irrigation found.");
        }

        const waterSource = await waterSourcesModel.findById(runningEvent.waterSource);

        if (!waterSource) {
            return errorResponse(res, 404, "Water source not found.");
        }

        const waterAmount = runningEvent.waterAmount;

        waterSource.currentLevel = Math.max(
            waterSource.currentLevel - waterAmount,
            0
        );
        await waterSource.save();

        const endedAt = new Date();

        const duration = Math.max(
            0,
            Math.floor(
                (endedAt.getTime() - runningEvent.startedAt.getTime()) / 1000
            )
        );

        runningEvent.endedAt = endedAt;
        runningEvent.duration = duration;
        console.log(isComplete);

        if (isComplete === "true") {
            runningEvent.status = "COMPLETED"
        } else {
            runningEvent.status = "CANCELLED";
        }

        await runningEvent.save();

        return successResponse(res, 200, "Irrigation stopped successfully", runningEvent);
    } catch (err) {
        next(err);
    }
};

exports.getIrrigationEvents = async (req, res, next) => {
    try {
        const page = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const limit = Math.min(
            Math.max(
                Number(req.query.limit) || 10,
                1
            ),
            100
        );

        const skip = (page - 1) * limit;

        const filter = {
            garden: req.garden._id
        };

        if (req.query.from || req.query.to) {
            filter.startedAt = {};

            if (req.query.from) {
                const from = new Date(req.query.from);

                if (Number.isNaN(from.getTime())) {
                    return errorResponse(res, 400, "Invalid 'from' date.");
                }

                filter.startedAt.$gte = from;
            }

            if (req.query.to) {
                const to = new Date(req.query.to);

                if (Number.isNaN(to.getTime())) {
                    return errorResponse(res, 400, "Invalid 'to' date.");
                }

                filter.startedAt.$lte = to;
            }
        }

        const [events, total] = await Promise.all([
            irrigationEventModel
                .find(filter)
                .sort({ startedAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("garden", "name location")
                .populate("waterSource", "name type capacity currentLevel minimumLevel criticalLevel")
                .lean(),

            irrigationEventModel.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(total / limit);

        return successResponse(res, 200, "Irrigation events retrieved successfully",
            {
                events,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            }
        );
    } catch (err) {
        next(err);
    }
};


////////* helper function for dashboard
const calculateNextRefill = (schedule, now) => {
    if (!schedule) {
        return null;
    }

    if (!schedule.startTime) {
        return null;
    }

    const [hours, minutes] =
        schedule.startTime
            .split(":")
            .map(Number);

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {
        return null;
    }

    const next = new Date(now);

    next.setSeconds(0, 0);

    next.setHours(
        hours,
        minutes,
        0,
        0
    );

    /* -------------------------------------------------
       WEEKLY
    ------------------------------------------------- */

    if (
        schedule.frequency === "WEEKLY"
    ) {
        if (
            schedule.dayOfWeek === undefined ||
            schedule.dayOfWeek === null
        ) {
            return null;
        }

        let daysUntil =
            schedule.dayOfWeek -
            next.getDay();

        if (
            daysUntil < 0 ||
            (
                daysUntil === 0 &&
                next <= now
            )
        ) {
            daysUntil += 7;
        }

        next.setDate(
            next.getDate() +
            daysUntil
        );

        return next;
    }

    /* -------------------------------------------------
       MONTHLY
    ------------------------------------------------- */

    if (
        schedule.frequency === "MONTHLY"
    ) {
        if (
            !schedule.dayOfMonth
        ) {
            return null;
        }

        next.setDate(
            schedule.dayOfMonth
        );

        if (next <= now) {
            next.setMonth(
                next.getMonth() + 1
            );

            next.setDate(
                schedule.dayOfMonth
            );
        }

        return next;
    }

    return null;
};