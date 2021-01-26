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
// const fs = require("fs");
// const MongoClient = require("mongodb").MongoClient;
// const url = "mongodb://localhost:5001/";
// const Json2csvParser = require("json2csv").Parser;
// const PDFDocument = require("pdfkit");
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "linkedin",
    format: async (req, file) => "png" || "jpg",
    public_id: (req, file) => "image",
  },
});
const parser = multer({ storage: storage });

// route.get("/json2csv", async (req, res, next) => {
//   try {
//     const allPost = await Post.find();

//     // allPost.toArray(function (err, result) {
//     //   if (err) throw err;
//     //   console.log(result);
//     // });
//     const csvFields = ["_id", "username", "image", "user"];
//     const json2csvParser = new Json2csvParser({ csvFields });
//     const csv = json2csvParser.parse(allPost);
//     console.log(csv);

//     const doc = new PDFDocument();
//     doc.text(csv);

//     doc.pipe(fs.createWriteStream("output3.pdf"));

//     doc.end();
//     res.status(200).send(allPost);
//   } catch (error) {
//     console.log(error);
//     next(error);
//   }
// });

// CHANGE PICTURE
expRoute.post("/:expId/picture", verifyToken, parser.single("image"), async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err) res.sendStatus(403);
      else {
        if (await ExperienceSchema.findOne({ $and: [{ _id: req.params.expId }, { username: data._id }] })) {
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

          console.log(req.file.path);
          res.status(200).send(modifiedExperience);
        } else res.sendStatus(403);
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

expRoute.post("/:expId", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err && req.body.username !== data._id) res.sendStatus(403);
      else {
        const myObj = {
          ...req.body,
          image: "https://miro.medium.com/max/10368/1*o8tTGo3vsocTKnCUyz0wHA.jpeg",
        };
        const newExp = new Exp(myObj);
        await newExp.save();
        res.status(201).send(newExp);
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//GET ALL EXPERIENCES
expRoute.get("/", async (req, res, next) => {
  try {
    const query = q2m(req.query);
    console.log(query);
    const allExperiences = await ExperienceSchema.find().sort({ createdAt: -1 });
    res.status(200).send(allExperiences);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//POST EXPERIENCE
expRoute.post("/", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err && req.body.username !== data._id) res.sendStatus(403);
      else {
        const newExperience = new ExperienceSchema(req.body);
        const { _id } = await newExperience.save();
        res.status(201).send(_id);
      }
    });
  } catch (error) {
    next(error);
  }
});

//GET SPECIFIC EXPERIENCE
expRoute.get("/:expId", async (req, res, next) => {
  try {
    const experienceId = req.params.experienceId;
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
expRoute.put("/:expId", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err) res.sendStatus(403);
      else {
        if (await ExperienceSchema.findOne({ $and: [{ _id: req.params.id }, { username: data._id }] })) {
          const experience = await ExperienceSchema.findByIdAndUpdate(req.params.id, req.body, {
            runValidators: true,
            new: true,
          });
          if (experience) {
            res.send(experience);
          } else {
            const error = new Error(`Experience with ID ${req.params.id} not found`);
            error.httpStatusCode = 404;
            next(error);
          }
        } else res.sendStatus(403);
      }
    });
  } catch (error) {
    next(error);
  }
});

expRoute.delete("/:expId", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err) res.sendStatus(403);
      else {
        if (await ExperienceSchema.findOne({ $and: [{ _id: req.params.id }, { username: data._id }] })) {
          const experience = await ExperienceSchema.findByIdAndDelete(req.params.id);
          if (experience) {
            res.send({ ...experience, ok: true });
          } else {
            const error = new Error(`experience with id ${req.params.id} not found`);
            error.httpStatusCode = 404;
            next(error);
          }
        } else res.sendStatus(403);
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = expRoute;
