const yup = require('yup');

const userUpdateSchema = yup.object().shape({
    firstname: yup
        .string()
        .trim()
        .min(2, "First name must be at least 2 characters")
        .max(50, "First name must be less than 50 characters"),

    lastname: yup
        .string()
        .trim()
        .min(2, "Last name must be at least 2 characters")
        .max(50, "Last name must be less than 50 characters"),

    username: yup
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be less than 30 characters")
        .matches(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers and underscores"
        )
});

const adminUpdateUserSchema = yup.object().shape({
    firstname: yup
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must be less than 50 characters'),
    lastname: yup
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must be less than 50 characters'),
    username: yup
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be less than 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
    phone: yup
        .string()
        .matches(/(^(0?9)|(\+?989))\d{2}\W?\d{3}\W?\d{4}/g, 'Invalid phone number format'),
    email: yup
        .string()
        .nullable()
        .transform((value) => value === '' ? null : value)
        .email('Invalid email format')
});

module.exports = {
    userUpdateSchema,
    adminUpdateUserSchema
}