const yup = require('yup');

const createSensorSchema = yup.object({
    name: yup
        .string()
        .required("Sensor name is required")
        .trim()
        .min(2, "Sensor name must be at least 2 characters")
        .max(100, "Sensor name must be less than 100 characters"),

    type: yup
        .string()
        .required("Sensor type is required")
        .oneOf(
            [
                "AIR_TEMPERATURE",
                "SOIL_TEMPERATURE",
                "SOIL_MOISTURE",
                "WATER_LEVEL"
            ],
            "Invalid sensor type"
        )
});

const updateSensorSchema = yup.object({
    name: yup
        .string()
        .trim()
        .min(2, "Sensor name must be at least 2 characters")
        .max(100, "Sensor name must be less than 100 characters")
});

module.exports = {
    createSensorSchema,
    updateSensorSchema
}