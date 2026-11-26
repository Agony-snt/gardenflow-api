const yup = require('yup');

const registerSchema = yup.object().shape({
    firstname: yup
        .string()
        .required('First name is required')
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must be less than 50 characters'),
    lastname: yup
        .string()
        .required('Last name is required')
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must be less than 50 characters'),
    username: yup
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be less than 30 characters'),
    phone: yup
        .string()
        .required('Phone number is required')
        .matches(/(^(0?9)|(\+?989))\d{2}\W?\d{3}\W?\d{4}/g, 'Invalid phone number format'),
    email: yup
        .string()
        .nullable()
        .transform((value) => value === '' ? null : value)
        .email('Invalid email format'),
    password: yup
        .string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be less than 100 characters')
});

const loginSchema = yup.object().shape({
    identifier: yup
        .string()
        .required('Username or phone is required'),
    password: yup
        .string()
        .required('Password is required')
});

const changePasswordSchema = yup.object().shape({
    currentPassword: yup
        .string()
        .required('Current password is required'),
    newPassword: yup
        .string()
        .required('New password is required')
        .min(8, 'New password must be at least 8 characters')
        .max(100, 'New password must be less than 100 characters')
});

module.exports = {
    registerSchema,
    loginSchema,
    changePasswordSchema
}