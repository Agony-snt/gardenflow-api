const express = require('express');

const sensorsController = require("./sensors.controller");

const { isAuth } = require("../../middlewares/authCheck");
const { updateSensorSchema } = require("../../validators/sensors.validator");
const { check } = require("../../utils/validation");

const router = express.Router();

router.route("/:id")
    .get(isAuth, sensorsController.getOne)
    .patch(isAuth, check(updateSensorSchema), sensorsController.update)
    .delete(isAuth, sensorsController.remove);

router.route("/:id/activate").patch(isAuth, sensorsController.activate);

router.route("/:id/deactivate").patch(isAuth, sensorsController.deactivate);

router.route("/:id/readings")
    .get(isAuth, sensorsController.showAllReadings)
    .post(isAuth, sensorsController.addReading);

router.route("/:id/readings/latest").get(isAuth, sensorsController.getLatestReading);


module.exports = router;