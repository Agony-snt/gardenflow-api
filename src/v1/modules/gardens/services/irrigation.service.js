const sensorModel = require("../../../models/Sensor");
const sensorReadingsModel = require("../../../models/SensorReading");
const waterSourcesModel = require("../../../models/WaterSource");
const waterSourceScheduleModel = require("../../../models/WaterSourceSchedule");
const irrigationEventModel = require("../../../models/IrrigationEvent");

const decision = async (gardenId) => {
    /*
     * Temporary V1 rules.
     * These values should eventually be provided/configured
     * according to the company's actual irrigation rules.
     */

    const minAirTemp = 10;
    const maxAirTemp = 35;

    const minSoilTemp = 8;
    const maxSoilTemp = 30;

    const minSoilMoisture = 25;
    const targetSoilMoisture = 40;

    // Latest reading must not be older than 30 minutes.
    const maxSensorAge = 30 * 60 * 1000;

    /* -------------------------------------------------
       1. Get active water source
    ------------------------------------------------- */

    const waterSource = await waterSourcesModel
        .findOne({
            garden: gardenId,
            isActive: true
        })
        .lean();

    if (!waterSource) {
        return {
            shouldIrrigate: false,
            reason: "WATER_SOURCE_NOT_FOUND"
        };
    }

    /* -------------------------------------------------
       2. Get active water source schedule
    ------------------------------------------------- */

    const waterSourceSchedule = await waterSourceScheduleModel
        .findOne({
            garden: gardenId,
            isActive: true
        })
        .lean();

    if (!waterSourceSchedule) {
        return {
            shouldIrrigate: false,
            reason: "NO_ACTIVE_WATER_SOURCE_SCHEDULE"
        };
    }

    /* -------------------------------------------------
       3. Get active sensors
    ------------------------------------------------- */

    const sensors = await sensorModel
        .find({
            garden: gardenId,
            isActive: true
        })
        .lean();

    const getSensorId = (type) => {
        const sensor = sensors.find(
            item => item.type === type
        );

        return sensor?._id;
    };

    const airTemperatureSensor = getSensorId(
        "AIR_TEMPERATURE"
    );

    const soilTemperatureSensor = getSensorId(
        "SOIL_TEMPERATURE"
    );

    const soilMoistureSensor = getSensorId(
        "SOIL_MOISTURE"
    );

    const waterLevelSensor = getSensorId(
        "WATER_LEVEL"
    );

    if (!airTemperatureSensor) {
        return {
            shouldIrrigate: false,
            reason: "AIR_TEMPERATURE_SENSOR_NOT_FOUND"
        };
    }

    if (!soilTemperatureSensor) {
        return {
            shouldIrrigate: false,
            reason: "SOIL_TEMPERATURE_SENSOR_NOT_FOUND"
        };
    }

    if (!soilMoistureSensor) {
        return {
            shouldIrrigate: false,
            reason: "SOIL_MOISTURE_SENSOR_NOT_FOUND"
        };
    }

    if (!waterLevelSensor) {
        return {
            shouldIrrigate: false,
            reason: "WATER_LEVEL_SENSOR_NOT_FOUND"
        };
    }

    /* -------------------------------------------------
       4. Get latest readings
    ------------------------------------------------- */

    const [
        airTempReading,
        soilTempReading,
        soilMoistureReading,
        waterLevelReading
    ] = await Promise.all([
        sensorReadingsModel
            .findOne({
                sensor: airTemperatureSensor
            })
            .sort({
                measuredAt: -1
            })
            .lean(),

        sensorReadingsModel
            .findOne({
                sensor: soilTemperatureSensor
            })
            .sort({
                measuredAt: -1
            })
            .lean(),

        sensorReadingsModel
            .findOne({
                sensor: soilMoistureSensor
            })
            .sort({
                measuredAt: -1
            })
            .lean(),

        sensorReadingsModel
            .findOne({
                sensor: waterLevelSensor
            })
            .sort({
                measuredAt: -1
            })
            .lean()
    ]);

    if (!airTempReading) {
        return {
            shouldIrrigate: false,
            reason: "AIR_TEMPERATURE_READING_NOT_FOUND"
        };
    }

    if (!soilTempReading) {
        return {
            shouldIrrigate: false,
            reason: "SOIL_TEMPERATURE_READING_NOT_FOUND"
        };
    }

    if (!soilMoistureReading) {
        return {
            shouldIrrigate: false,
            reason: "SOIL_MOISTURE_READING_NOT_FOUND"
        };
    }

    if (!waterLevelReading) {
        return {
            shouldIrrigate: false,
            reason: "WATER_LEVEL_READING_NOT_FOUND"
        };
    }

    /* -------------------------------------------------
       5. Check reading freshness
    ------------------------------------------------- */

    const now = Date.now();

    const readings = [
        airTempReading,
        soilTempReading,
        soilMoistureReading,
        waterLevelReading
    ];

    const staleReading = readings.find((reading) => {
        const measuredAt = new Date(
            reading.measuredAt
        ).getTime();

        return (
            Number.isNaN(measuredAt) ||
            now - measuredAt > maxSensorAge
        );
    });

    if (staleReading) {
        return {
            shouldIrrigate: false,
            reason: "SENSOR_READING_TOO_OLD",
            measuredAt: staleReading.measuredAt
        };
    }

    /* -------------------------------------------------
       6. Current values
    ------------------------------------------------- */

    const airTemp = airTempReading.value;

    const soilTemp = soilTempReading.value;

    const soilMoisture = soilMoistureReading.value;

    /*
     * currentLevel is updated whenever a WATER_LEVEL
     * SensorReading is received.
     */
    const currentWaterLevel = waterSource.currentLevel;

    /* -------------------------------------------------
       7. Check current irrigation
    ------------------------------------------------- */

    const runningIrrigation = await irrigationEventModel
        .findOne({
            garden: gardenId,
            status: "RUNNING"
        })
        .lean();

    if (runningIrrigation) {
        return {
            shouldIrrigate: false,
            reason: "IRRIGATION_ALREADY_RUNNING",
            irrigationEvent: runningIrrigation._id
        };
    }

    /* -------------------------------------------------
       8. Critical water level
    ------------------------------------------------- */

    if (
        currentWaterLevel === undefined ||
        currentWaterLevel === null
    ) {
        return {
            shouldIrrigate: false,
            reason: "CURRENT_WATER_LEVEL_UNAVAILABLE"
        };
    }

    if (
        currentWaterLevel <=
        waterSource.criticalLevel
    ) {
        return {
            shouldIrrigate: false,
            reason: "CRITICAL_WATER_LEVEL",
            water: {
                currentLevel: currentWaterLevel,
                criticalLevel: waterSource.criticalLevel,
                capacity: waterSource.capacity
            }
        };
    }

    /* -------------------------------------------------
       9. Soil moisture
    ------------------------------------------------- */

    if (
        soilMoisture >=
        targetSoilMoisture
    ) {
        return {
            shouldIrrigate: false,
            reason: "SOIL_MOISTURE_SUFFICIENT",

            conditions: {
                soilMoisture,
                targetSoilMoisture,
                airTemperature: airTemp,
                soilTemperature: soilTemp
            }
        };
    }

    if (
        soilMoisture <
        minSoilMoisture
    ) {
        // Continue to temperature and water checks.
    }

    /* -------------------------------------------------
       10. Air temperature
    ------------------------------------------------- */

    if (airTemp < minAirTemp) {
        return {
            shouldIrrigate: false,
            reason: "AIR_TEMPERATURE_TOO_LOW",

            conditions: {
                airTemperature: airTemp,
                minAirTemperature: minAirTemp,
                soilTemperature: soilTemp,
                soilMoisture
            }
        };
    }

    /* -------------------------------------------------
       11. Soil temperature
    ------------------------------------------------- */

    if (soilTemp < minSoilTemp) {
        return {
            shouldIrrigate: false,
            reason: "SOIL_TEMPERATURE_TOO_LOW",

            conditions: {
                airTemperature: airTemp,
                soilTemperature: soilTemp,
                minSoilTemperature: minSoilTemp,
                soilMoisture
            }
        };
    }

    /* -------------------------------------------------
       12. Get next refill
    ------------------------------------------------- */

    const nextRefill = calculateNextRefill(
        waterSourceSchedule,
        new Date()
    );

    if (!nextRefill) {
        return {
            shouldIrrigate: false,
            reason: "NEXT_REFILL_CANNOT_BE_CALCULATED"
        };
    }

    const timeUntilNextRefill = Math.max(
        Math.floor(
            (nextRefill.getTime() - Date.now()) / 1000
        ),
        0
    );

    /* -------------------------------------------------
       13. Calculate usable water
    ------------------------------------------------- */

    const usableWater = Math.max(
        currentWaterLevel -
        waterSource.criticalLevel,
        0
    );

    if (usableWater <= 0) {
        return {
            shouldIrrigate: false,
            reason: "NO_USABLE_WATER",

            water: {
                currentLevel: currentWaterLevel,
                criticalLevel: waterSource.criticalLevel,
                usableWater
            },

            refill: {
                nextRefill,
                timeUntilNextRefill
            }
        };
    }

    /* -------------------------------------------------
   14. Calculate irrigation days until next refill
------------------------------------------------- */

    let irrigationDaysRemaining;

    if (waterSourceSchedule.frequency === "WEEKLY") {
        const daysUntilRefill = timeUntilNextRefill / (24 * 60 * 60);
        irrigationDaysRemaining = Math.ceil(daysUntilRefill) + 1;
    }

    if (waterSourceSchedule.frequency === "MONTHLY") {
        const daysUntilRefill = timeUntilNextRefill / (24 * 60 * 60);
        irrigationDaysRemaining = Math.ceil(daysUntilRefill) + 1;
    }

    if (!irrigationDaysRemaining) {
        return {
            shouldIrrigate: false,
            reason: "INVALID_WATER_SOURCE_FREQUENCY"
        };
    }

    /* -------------------------------------------------
       15. One irrigation per day
    ------------------------------------------------- */

    const irrigationsPerDay = 1;

    /* -------------------------------------------------
       16. Check if irrigation was already done today
    ------------------------------------------------- */

    const startOfToday = new Date();

    startOfToday.setHours(0, 0, 0, 0);

    const irrigationToday = await irrigationEventModel.findOne({
        garden: gardenId,
        status: {
            $in: ["RUNNING", "COMPLETED"]
        },
        startedAt: {
            $gte: startOfToday
        }
    });

    if (irrigationToday) {
        return {
            shouldIrrigate: false,
            reason: "IRRIGATION_ALREADY_DONE_TODAY"
        };
    }

    /* -------------------------------------------------
       17. Calculate irrigation opportunities
    ------------------------------------------------- */

    const irrigationOpportunities =
        irrigationDaysRemaining *
        irrigationsPerDay;

    /* -------------------------------------------------
       18. Calculate daily water budget
    ------------------------------------------------- */

    const dailyWaterBudget = Math.round(
        usableWater / irrigationOpportunities
    );


    /* -------------------------------------------------
       19. Temperature factor
    ------------------------------------------------- */

    let temperatureFactor = 1;

    if (airTemp > maxAirTemp) {
        temperatureFactor += 0.20;
    }

    if (soilTemp > maxSoilTemp) {
        temperatureFactor += 0.10;
    }

    /* -------------------------------------------------
       20. Calculate estimated irrigation amount
------------------------------------------------- */

    const MAX_IRRIGATION_PER_SESSION = 5000;

    let estimatedWaterAmount = Math.round(
        dailyWaterBudget * temperatureFactor
    )

    estimatedWaterAmount = Math.min(
        estimatedWaterAmount,
        MAX_IRRIGATION_PER_SESSION,
        usableWater
    );

    /* -------------------------------------------------
       21. Final decision
    ------------------------------------------------- */

    return {
        shouldIrrigate: true,

        reason:
            soilMoisture < minSoilMoisture
                ? "LOW_SOIL_MOISTURE"
                : "SOIL_MOISTURE_BELOW_TARGET",

        conditions: {
            airTemperature: airTemp,
            soilTemperature: soilTemp,
            soilMoisture,

            thresholds: {
                minAirTemperature: minAirTemp,
                maxAirTemperature: maxAirTemp,

                minSoilTemperature: minSoilTemp,
                maxSoilTemperature: maxSoilTemp,

                minSoilMoisture,
                targetSoilMoisture
            }
        },

        water: {
            currentLevel: currentWaterLevel,
            capacity: waterSource.capacity,
            criticalLevel: waterSource.criticalLevel,
            usableWater,

            irrigationDaysRemaining,
            irrigationsPerDay,
            irrigationOpportunities,
            dailyWaterBudget,
            estimatedWaterAmount
        },

        refill: {
            frequency: waterSourceSchedule.frequency,
            nextRefill,
            timeUntilNextRefill
        }
    };
};


/* =====================================================
   Calculate next refill
===================================================== */

const calculateNextRefill = (schedule, now) => {
    if (!schedule) {
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

    /*
     * If lastRefillAt exists, it is the most reliable
     * anchor for WEEKLY schedules.
     */
    if (
        schedule.lastRefillAt
    ) {
        const lastRefill = new Date(
            schedule.lastRefillAt
        );

        if (
            Number.isNaN(
                lastRefill.getTime()
            )
        ) {
            return null;
        }

        if (
            schedule.frequency === "WEEKLY"
        ) {
            const next = new Date(
                lastRefill
            );

            next.setDate(
                next.getDate() + 7
            );

            next.setHours(
                hours,
                minutes,
                0,
                0
            );

            return next;
        }
    }

    /*
     * Fallback when lastRefillAt is not available.
     */

    const next = new Date(now);

    next.setSeconds(0, 0);

    next.setHours(
        hours,
        minutes,
        0,
        0
    );

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


module.exports = {
    decision
};