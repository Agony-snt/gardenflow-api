const express = require('express');

const waterSouceController = require("./ws.controller");

const { isAuth } = require("../../middlewares/authCheck");
const { updateWaterSourceSchema } = require("../../validators/ws.validator");
const { check } = require("../../utils/validation");

const router = express.Router();

router.route("/:id")
    .get(isAuth, waterSouceController.getOne)
    .patch(isAuth, check(updateWaterSourceSchema), waterSouceController.update)
    .delete(isAuth, waterSouceController.remove);

router.route("/:id/activate").patch(isAuth, waterSouceController.activate);

router.route("/:id/deactivate").patch(isAuth, waterSouceController.deactivate);

router.route("/:id/schedule")
    .get(isAuth, waterSouceController.showSchedule)
    .post(isAuth, waterSouceController.createSchedule);


module.exports = router;