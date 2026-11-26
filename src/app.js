const express = require('express');

const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { errHandler } = require("./v1/middlewares/errorHandler");

const authRouter = require("./v1/modules/auth/auth.routes");
const usersRouter = require("./v1/modules/users/users.routes");
const gardensRouter = require("./v1/modules/gardens/gardens.routes");
const waterSourcesRouter = require("./v1/modules/water-sources/ws.routes");
const sensorsRouter = require('./v1/modules/sensors/sensors.routes');
const waterSourcesScheduleRouter = require("./v1/modules/water-sources-schedule/ws.schedules.routes");
const docsRouter = require("./v1/modules/docs/docs.routes");


const app = express();


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cookieParser());
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));


app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/gardens", gardensRouter);
app.use("/api/v1/water-sources", waterSourcesRouter);
app.use("/api/v1/sensors", sensorsRouter);
app.use("/api/v1/water-sources-schedule", waterSourcesScheduleRouter);
app.use("/api-docs", docsRouter);

app.use((req, res, next) => {
    return res.status(404).json({
        status: "404 Not Found",
        message: "Route not found",
    });
});

app.use(errHandler);

module.exports = app;