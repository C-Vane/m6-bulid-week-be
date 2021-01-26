const express = require("express");
const { Mongoose, Types } = require("mongoose");

const ProfilesSchema = require("./schema");

const profilesRouter = express.Router();

const jwt = require("jsonwebtoken");

const cloudinary = require("cloudinary").v2;

const { CloudinaryStorage } = require("multer-storage-cloudinary");

const multer = require("multer");

const secretKey = process.env.TOKEN_SECRET;

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "linkedin",
    format: async (req, file) => "png" || "jpg",
    public_id: (req, file) => "image",
  },
});

const verifyToken = (req, res, next) => {
  const barrierHeader = req.headers["authorization"];
  if (typeof barrierHeader !== "undefined") {
    const barrierTocken = barrierHeader.split(" ")[1];
    req.token = barrierTocken;
    next();
  } else {
    res.sendStatus(403);
  }
};

const parser = multer({ storage: storage });

profilesRouter.get("/", async (req, res, next) => {
  try {
    const profiles = await ProfilesSchema.find()
      .select(["-password", "-email", "-bio", "-area", "-createdAt", "-updatedAt"])
      .sort({ createdAt: -1 })
      .skip(req.query.page && (req.query.page - 1) * 10)
      .limit(10);
    res.send(profiles);
  } catch (error) {
    next(error);
  }
});

profilesRouter.get("/:Id", verifyToken, async (req, res, next) => {
  try {
    const id = req.params.Id;
    const profile = await ProfilesSchema.findById(id).select("-password");
    if (profile) {
      jwt.verify(req.token, secretKey, (err, profile) => {
        if (err) res.sendStatus(403);
        else res.send(profile);
      });
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next("While reading profiles list a problem occurred!");
  }
});

//USER SIGN IN
profilesRouter.post("/login", async (req, res, next) => {
  try {
    const user = await ProfilesSchema.findOne({ $and: [{ $or: [{ username: req.body.user }, { email: req.body.user }] }, { password: req.body.password }] });
    if (user) {
      jwt.sign({ user }, secretKey, (err, token) => {
        res.json({ token: token });
      });
    } else {
      const error = new Error(`profile with given email/username and password not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

profilesRouter.post("/", async (req, res, next) => {
  try {
    const newprofile = new ProfilesSchema({
      ...req.body,
      image: "https://thumbs.dreamstime.com/b/default-avatar-profile-trendy-style-social-media-user-icon-187599373.jpg",
      background: "https://thumbs.dreamstime.com/b/default-avatar-profile-trendy-style-social-media-user-icon-187599373.jpg",
    });
    const { _id } = await newprofile.save();
    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

//POST IMAGE TO PROFILE
profilesRouter.post("/:id/upload", verifyToken, parser.single("image"), async (req, res, next) => {
  try {
    const modifiedProfile = await ProfilesSchema.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.query.background
          ? {
              background: req.file.path,
            }
          : {
              image: req.file.path,
            },
      },
      {
        useFindAndModify: false,
        new: true,
      }
    );
    res.status(200).send(modifiedProfile);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//EDIT PROFILE

profilesRouter.put("/:id", verifyToken, async (req, res, next) => {
  try {
    const profile = await ProfilesSchema.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });
    if (profile) {
      res.send(profile);
    } else {
      const error = new Error(`profile with id ${req.params.id} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

//DELETE PROFILE

profilesRouter.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const profile = await ProfilesSchema.findByIdAndDelete(req.params.id);
    if (profile) {
      res.send({ ...profile, ok: true });
    } else {
      const error = new Error(`profile with id ${req.params.id} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});
module.exports = profilesRouter;
