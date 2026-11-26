const yup = require('yup');

const createGardenSchema = yup.object({
    name: yup
        .string()
        .required("Garden name is required")
        .trim()
        .min(2, "Garden name must be at least 2 characters")
        .max(100, "Garden name must be less than 100 characters"),

    area: yup
        .number()
        .required("Garden area is required")
        .positive("Garden area must be greater than 0"),

    province: yup
        .string()
        .required("Province is required")
        .trim()
        .min(2, "Province must be at least 2 characters")
        .max(100, "Province must be less than 100 characters"),

    city: yup
        .string()
        .required("City is required")
        .trim()
        .min(2, "City must be at least 2 characters")
        .max(100, "City must be less than 100 characters"),

    latitude: yup
        .number()
        .required("Latitude is required")
        .min(-90, "Latitude must be between -90 and 90")
        .max(90, "Latitude must be between -90 and 90"),

    longitude: yup
        .number()
        .required("Longitude is required")
        .min(-180, "Longitude must be between -180 and 180")
        .max(180, "Longitude must be between -180 and 180")
});

const updateGardenSchema = yup.object({
    name: yup
        .string()
        .trim()
        .min(2, "Garden name must be at least 2 characters")
        .max(100, "Garden name must be less than 100 characters"),

    area: yup
        .number()
        .positive("Garden area must be greater than 0"),

    province: yup
        .string()
        .trim()
        .min(2, "Province must be at least 2 characters")
        .max(100, "Province must be less than 100 characters"),

    city: yup
        .string()
        .trim()
        .min(2, "City must be at least 2 characters")
        .max(100, "City must be less than 100 characters"),

    latitude: yup
        .number()
        .min(-90, "Latitude must be between -90 and 90")
        .max(90, "Latitude must be between -90 and 90"),

    longitude: yup
        .number()
        .min(-180, "Longitude must be between -180 and 180")
        .max(180, "Longitude must be between -180 and 180")
});

module.exports = {
    createGardenSchema,
    updateGardenSchema
}