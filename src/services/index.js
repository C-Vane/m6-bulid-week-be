const router = require("express").Router();
const comments = require("./Comments/index.js");
const post = require("./Posts/index.js");
const profile = require("./Profiles/index.js");
////ALL APIS
router.use("/profile", profile);
router.use("/comments", comments);
router.use("/post", post);
module.exports = router;
