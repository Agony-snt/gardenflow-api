const yup = require('yup');

const createWaterSourceSchema = yup.object({
    name: yup
        .string()
        .required("Water source name is required")
        .trim()
        .min(2, "Water source name must be at least 2 characters")
        .max(100, "Water source name must be less than 100 characters"),

    type: yup
        .string()
        .required("Water source type is required")
        .oneOf(
            ["POOL", "TANK"],
            "Water source type must be either POOL or TANK"
        ),

    capacity: yup
        .number()
        .typeError("Capacity must be a number")
        .required("Capacity is required")
        .positive("Capacity must be greater than 0")
});

const updateWaterSourceSchema = yup.object({
    name: yup
        .string()
        .trim()
        .min(2, "Water source name must be at least 2 characters")
        .max(100, "Water source name must be less than 100 characters")
});

module.exports = {
    createWaterSourceSchema,
    updateWaterSourceSchema
}