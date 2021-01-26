const router = require("express").Router();
const comments = require("./Comments/index.js");
const post = require("./Posts/index.js");
const profile = require("./Profiles/index.js");
const experiences = require("./Experiences/index.js");
////ALL APIS

router.use("/profile", profile);
router.use("/comments", comments);
router.use("/post", post);
router.use("/experiences", experiences);

module.exports = router;
