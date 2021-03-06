const express = require("express");
const mongoose = require("mongoose");
const ExperienceSchema = require("./schema");
const expRoute = express.Router();
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const { verifyToken } = require("../../utilities/errorHandler");
const jwt = require("jsonwebtoken");
const q2m = require("query-to-mongo");
const secretKey = process.env.TOKEN_SECRET;
const UserSchema = require("../Profiles/schema");
const { parse } = require("json2csv");
const fs = require("fs");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "linkedin",
    format: async (req, file) => "png" || "jpg",
    public_id: (req, file) => "image",
  },
});
const parser = multer({ storage: storage });

//------------------- route for csv----------------------//
expRoute.get("/:username/experiences/CSV", async (req, res, next) => {
  try {
    const allExperiences = await ExperienceSchema.find({
      userName: req.params.username,
    });

    const fields = ["_id", "role", "user", "description"];
    const opts = { fields };

    const csv = parse(allExperiences, opts);

    fs.writeFile("testo.csv", csv, "utf8", function (err) {
      if (err) {
        console.log("ERROR. SHIT!!!.");
      } else {
        console.log("IT'S SAVED");
        res.status(200).download("testo.csv");
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// CHANGE PICTURE
expRoute.post(
  "/:username/experience/:expId/picture",
  verifyToken,
  parser.single("image"),
  async (req, res, next) => {
    try {
      jwt.verify(req.token, secretKey, async (err, data) => {
        if (err) res.sendStatus(403);
        else {
          if (
            await ExperienceSchema.findOne({
              $and: [{ _id: req.params.expId }, { user: data._id }],
            })
          ) {
            const modifiedExperience = await ExperienceSchema.findByIdAndUpdate(
              req.params.expId,
              {
                $set: {
                  image: req.file.path,
                },
              },
              {
                useFindAndModify: false,
              }
            );
            res.status(200).send(modifiedExperience);
          } else res.sendStatus(403);
        }
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

expRoute.post("/:username/experience", verifyToken, async (req, res, next) => {
  try {
    console.log(req.params);
    const { _id } = await UserSchema.findOne({ username: req.params.username });
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err && _id !== data._id) res.sendStatus(403);
      else {
        const myObj = {
          ...req.body,
          userName: req.params.username,
          user: _id,
          image:
            "https://miro.medium.com/max/10368/1*o8tTGo3vsocTKnCUyz0wHA.jpeg",
        };
        const newExp = new ExperienceSchema(myObj);
        await newExp.save();
        res.status(201).send(newExp);
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//GET ALL EXPERIENCES for a user
expRoute.get("/:username/experience", async (req, res, next) => {
  try {
    const query = q2m(req.query);
    console.log(query);
    const allExperiences = await ExperienceSchema.find({
      userName: req.params.username,
    }).sort({ startDate: -1 });
    res.status(200).send(allExperiences);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//POST EXPERIENCE
/* expRoute.post("/", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err && req.body.user !== data._id) res.sendStatus(403);
      else {
        const newExperience = new ExperienceSchema(req.body);
        const { _id } = await newExperience.save();
        res.status(201).send(_id);
      }
    });
  } catch (error) {
    next(error);
  }
}); */

//GET SPECIFIC EXPERIENCE
expRoute.get("/:username/experience/:expId", async (req, res, next) => {
  try {
    const experienceId = req.params.expId;
    const experience = await ExperienceSchema.findById(experienceId);
    if (experience) {
      res.send(experience);
    } else {
      const error = new Error(`Experience with ID ${req.params.id} not found`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

//EDIT EXPERIENCE
expRoute.put(
  "/:username/experience/:expId",
  verifyToken,
  async (req, res, next) => {
    try {
      jwt.verify(req.token, secretKey, async (err, data) => {
        if (err) res.sendStatus(403);
        else {
          if (
            await ExperienceSchema.findOne({
              $and: [{ _id: req.params.expId }, { user: data._id }],
            })
          ) {
            const experience = await ExperienceSchema.findByIdAndUpdate(
              req.params.expId,
              req.body,
              {
                runValidators: true,
                new: true,
              }
            );
            if (experience) {
              res.send(experience);
            } else {
              const error = new Error(
                `Experience with ID ${req.params.id} not found`
              );
              error.httpStatusCode = 404;
              next(error);
            }
          } else res.sendStatus(403);
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

expRoute.delete(
  "/:username/experience/:expId",
  verifyToken,
  async (req, res, next) => {
    try {
      jwt.verify(req.token, secretKey, async (err, data) => {
        if (err) res.sendStatus(403);
        else {
          if (
            await ExperienceSchema.findOne({
              $and: [{ _id: req.params.expId }, { user: data._id }],
            })
          ) {
            const experience = await ExperienceSchema.findByIdAndDelete(
              req.params.expId
            );
            if (experience) {
              res.send({ ...experience, ok: true });
            } else {
              const error = new Error(
                `experience with id ${req.params.expId} not found`
              );
              error.httpStatusCode = 404;
              next(error);
            }
          } else res.sendStatus(403);
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = expRoute;
