const express = require('express');

const scheduleController = require("./ws.schedules.controller");

const { isAuth } = require('../../middlewares/authCheck');

const router = express.Router();

router.route("/:id")
    .patch(isAuth, scheduleController.update)
    .delete(isAuth, scheduleController.remove);

router.route("/:id/activate")
    .patch(isAuth, scheduleController.activate)

router.route("/:id/deactivate")
    .patch(isAuth, scheduleController.deactivate)


module.exports = router;