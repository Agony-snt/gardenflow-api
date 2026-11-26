const express = require('express');

const usersController = require("./users.controller");

const { isAuth } = require("../../middlewares/authCheck");
const { isAdmin } = require("../../middlewares/authGaurd");
const { userUpdateSchema, adminUpdateUserSchema } = require("../../validators/users.validator");
const { check } = require("../../utils/validation");


const router = express.Router();

router.route("/me")
    .patch(isAuth, check(userUpdateSchema), usersController.updateProfile)
    .delete(isAuth, usersController.removeProfile);

router.route("/").get(isAuth, isAdmin, usersController.getAll);

router.route("/:id")
    .get(isAuth, isAdmin, usersController.getOne)
    .patch(isAuth, isAdmin, check(adminUpdateUserSchema), usersController.updateOne)
    .delete(isAuth, isAdmin, usersController.removeOne);

router.route("/:id/activate").patch(isAuth, isAdmin, usersController.activate);

router.route("/:id/deactivate").patch(isAuth, isAdmin, usersController.deactivate);


module.exports = router;