const postRoute = require("./Posts");

const route = require("express").Router();

route.use("/post", postRoute);

module.exports = route;
