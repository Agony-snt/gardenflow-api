const express = require("express");
const swaggerUi = require("swagger-ui-express");

const router = express.Router();

const swaggerDocument = require("./docs.json");

router.use("/",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);

module.exports = router;