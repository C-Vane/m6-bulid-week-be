const router = require("express").Router();
const comments = require("./Comments/index.js");
////ALL APIS
router.use("/comments", comments);
module.exports = router;
