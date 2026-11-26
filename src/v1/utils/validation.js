exports.check = (schema) => {
    return async (req, res, next) => {
        try {
            const value = await schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
            });

            req.body = value;

            next();
        } catch (err) {
            if (err.name === "ValidationError") {
                return res.status(400).json({
                    success: false,
                    message: err.errors[0],
                    errors: err.errors,
                });
            }

            next(err);
        }
    };
};