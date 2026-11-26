const yup = require('yup');

const createScheduleSchema = yup.object({
    frequency: yup
        .string()
        .required("Frequency is required")
        .oneOf(
            ["WEEKLY", "MONTHLY"],
            "Frequency must be WEEKLY or MONTHLY"
        ),

    dayOfWeek: yup
        .number()
        .integer("Day of week must be an integer")
        .min(0, "Day of week must be between 0 and 6")
        .max(6, "Day of week must be between 0 and 6")
        .when("frequency", {
            is: "WEEKLY",

            then: (schema) =>
                schema.required(
                    "Day of week is required for weekly schedules"
                ),

            otherwise: (schema) =>
                schema.notRequired().strip()
        }),

    dayOfMonth: yup
        .number()
        .integer("Day of month must be an integer")
        .min(1, "Day of month must be between 1 and 31")
        .max(31, "Day of month must be between 1 and 31")
        .when("frequency", {
            is: "MONTHLY",

            then: (schema) =>
                schema.required(
                    "Day of month is required for monthly schedules"
                ),

            otherwise: (schema) =>
                schema.notRequired().strip()
        }),

    startTime: yup
        .string()
        .required("Start time is required")
        .matches(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Start time must be in HH:mm format"
        )
});

const updateScheduleSchema = yup.object({
    frequency: yup
        .string()
        .oneOf(
            ["WEEKLY", "BIWEEKLY", "MONTHLY"],
            "Frequency must be WEEKLY or MONTHLY"
        ),

    dayOfWeek: yup
        .number()
        .integer("Day of week must be an integer")
        .min(0, "Day of week must be between 0 and 6")
        .max(6, "Day of week must be between 0 and 6")
        .nullable(),

    dayOfMonth: yup
        .number()
        .integer("Day of month must be an integer")
        .min(1, "Day of month must be between 1 and 31")
        .max(31, "Day of month must be between 1 and 31")
        .nullable(),

    startTime: yup
        .string()
        .matches(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Start time must be in HH:mm format"
        )
});

module.exports = {
    createScheduleSchema,
    updateScheduleSchema
}