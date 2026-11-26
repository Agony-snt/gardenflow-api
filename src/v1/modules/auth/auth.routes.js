const express = require('express');

const authController = require("./auth.controller");

const { isAuth } = require("../../middlewares/authCheck");
const { registerSchema, loginSchema, changePasswordSchema } = require("../../validators/auth.validator");
const { check } = require("../../utils/validation");

const router = express.Router();

router.route("/register").post(check(registerSchema), authController.register);

router.route("/login").post(check(loginSchema), authController.login);

router.route("/logout").post(isAuth, authController.logout);

router.route("/refresh").post(authController.refresh);

router.route("/me").get(isAuth, authController.showMe);

router.route("/change-password").patch(isAuth, check(changePasswordSchema), authController.changePassword);


module.exports = router;