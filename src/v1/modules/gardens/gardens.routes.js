const express = require('express');

const gardensController = require("./gardens.controller");

const { isAuth } = require("../../middlewares/authCheck");
const { isGardenOwner } = require("../../middlewares/gardenOwner");
const { isAdmin } = require("../../middlewares/authGaurd");
const { createGardenSchema, updateGardenSchema } = require("../../validators/gardens.validator");
const { createWaterSourceSchema } = require("../../validators/ws.validator");
const { createSensorSchema } = require("../../validators/sensors.validator");
const { check } = require("../../utils/validation");

const router = express.Router();

router.route("/")
    .get(isAuth, gardensController.getAll)
    .post(isAuth, check(createGardenSchema), gardensController.create)

router.route("/:id")
    .get(isAuth, isGardenOwner, gardensController.getOne)
    .patch(isAuth, isGardenOwner, check(updateGardenSchema), gardensController.update)
    .delete(isAuth, isGardenOwner, gardensController.remove);

router.route("/:id/activate").patch(isAuth, isGardenOwner, gardensController.activate);

router.route("/:id/deactivate").patch(isAuth, isGardenOwner, gardensController.deactivate);

router.route("/:id/owner").patch(isAuth, isAdmin, gardensController.changeOwner);

router.route("/user/:userId").get(isAuth, isAdmin, gardensController.getAllUserGardens);

router.route("/:id/dashboard").get(isAuth, isGardenOwner, gardensController.dashboard)

router.route("/:id/water-sources").post(isAuth, isGardenOwner, check(createWaterSourceSchema), gardensController.createWaterSource);

router.route("/:id/sensors")
    .get(isAuth, isGardenOwner, gardensController.getSensors)
    .post(isAuth, isGardenOwner, check(createSensorSchema), gardensController.createSensor);

router.route("/:id/irrigation/status").get(isAuth, isGardenOwner, gardensController.getIrrigationStatus);

router.route("/:id/irrigation/decision").get(isAuth, isGardenOwner, gardensController.getIrrigationDecision);

router.route("/:id/irrigation/start").post(isAuth, isGardenOwner, gardensController.startIrrigation);

router.route("/:id/irrigation/stop").patch(isAuth, isGardenOwner, gardensController.stopIrrigation);

router.route("/:id/irrigation/events").get(isAuth, isGardenOwner, gardensController.getIrrigationEvents);



module.exports = router;