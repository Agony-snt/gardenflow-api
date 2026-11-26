const mongoose = require('mongoose');
const app = require("./app");
const configs = require('./configs');
const { log } = require("console");

const connectToDB = async () => {
    try {
        await mongoose.connect(configs.mongodb);
        log("Connected to MongoDB...");
        return;
    } catch (err) {
        return log("Error while connecting to MongoDB...", err);
    }
};

const startServer = () => {
    try {
        app.listen(configs.port, () => {
            log(`Server is running on port ${configs.port}...\nAccess the API documentation at http://localhost:${configs.port}/api-docs`);
        });
        return;
    } catch (err) {
        log("Error while starting server...", err);
        return process.exit(1);
    }
};

const run = () => {
    startServer();
    connectToDB();
};

run();