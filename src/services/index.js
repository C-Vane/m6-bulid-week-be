const router = require("express").Router();
const comments = require("./Comments/index.js");
const post = require("./Posts/index.js");
////ALL APIS
router.use("/comments", comments);
router.use("/post", post);
module.exports = router;
