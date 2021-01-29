const express = require("express");
const { Mongoose, Types } = require("mongoose");

const ProfilesSchema = require("./schema");
const ExperienceSchema = require("../Experiences/schema");
const CommentsSchema = require("../Comments/schema");
const PostSchema = require("../Posts/schema");

const profilesRouter = express.Router();

const jwt = require("jsonwebtoken");

const PDFDocument = require("pdfkit");

const fs = require("fs");

const cloudinary = require("cloudinary").v2;

const { CloudinaryStorage } = require("multer-storage-cloudinary");

const multer = require("multer");

const secretKey = process.env.TOKEN_SECRET;

const createPDF = require("./PDF/pdf-generator");

const moment = require("moment");

const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "linkedin",
    format: async (req, file) => "png" || "jpg",
    public_id: (req, file) => "image",
  },
});
const { verifyToken } = require("../../utilities/errorHandler");
const parser = multer({ storage: storage });

profilesRouter.get("/", async (req, res, next) => {
  try {
    const profiles = await ProfilesSchema.find(req.query.search && { $text: { $search: req.query.search } })
      .select(["-password", "-email", "-bio", "-area", "-createdAt", "-updatedAt"])
      .sort({ createdAt: -1 })
      .skip(req.query.page && (req.query.page - 1) * 10)
      .limit(10);
    res.send(profiles);
  } catch (error) {
    next(error);
  }
});

profilesRouter.get("/user/:username", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err) res.sendStatus(403);
      else {
        const profile = await ProfilesSchema.findById(data._id);
        if (profile) {
          res.send(profile);
        } else {
          const error = new Error("USER not found or token expired");
          error.httpStatusCode = 404;
          next(error);
        }
      }
    });
  } catch (error) {
    console.log(error);
    next("While reading profiles list a problem occurred!");
  }
});
profilesRouter.get("/:username", async (req, res, next) => {
  try {
    const id = req.params.Id;
    const profile = await ProfilesSchema.findOne({
      username: req.params.username,
    }).select(["-password", "-email"]);
    if (profile) {
      res.send(profile);
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
    const user = await ProfilesSchema.findOne({
      $and: [{ $or: [{ username: req.body.user }, { email: req.body.user }] }, { password: req.body.password }],
    });
    if (user) {
      jwt.sign({ _id: user._id }, secretKey, (err, token) => {
        if (err) res.sendStatus(404);
        else res.json({ token: token });
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

    const { email, password, username, name } = newprofile;

    console.log(email);
    if (email.length > 0) {
      const msg = {
        to: `${email}`,
        from: "studentrichard4@gmail.com",
        subject: "Welcome to our community",
        text: "CONFIRMATION",
        html: `<style>*{  background: url("https://wallpapercave.com/wp/wp4421266.jpg") no-repeat fixed center; background-size: cover; color:white;} div{text-align: center; color:green!important;}</style><strong>Thank you ${name} for joining our community. This is the confirmation mail with your credentials:<br/> <br/> <div>Username:${username} <br/>Password:${password}</div></strong>.<br/><br/><br/> Thank you for choosing Linkedin. <br/> -Team 0 S1- `,
      };

      await sgMail.send(msg);
    }

    const profile = await newprofile.save();
    res.status(201).send(profile);
  } catch (error) {
    next(error);
  }
});

//POST IMAGE TO PROFILE
profilesRouter.post("/:id/picture", verifyToken, parser.single("image"), async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, user) => {
      if (err) res.sendStatus(403);
      else {
        const modifiedProfile = await ProfilesSchema.findByIdAndUpdate(
          user._id,
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
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//EDIT PROFILE

profilesRouter.put("/:id", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err && data._id !== req.params.id) res.sendStatus(403);
      else {
        const profile = await ProfilesSchema.findByIdAndUpdate(data._id, req.body, {
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
      }
    });
  } catch (error) {
    next(error);
  }
});

//DELETE PROFILE

profilesRouter.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err && data._id !== req.params.id) res.sendStatus(403);
      else {
        const profile = await ProfilesSchema.findByIdAndDelete(data._id);
        await PostSchema.deleteMany({ user: data._id });
        await ExperienceSchema.deleteMany({ user: data._id });
        await CommentsSchema.deleteMany({ author: data._id });
        await PostSchema.updateMany({ reactions: { $in: { user: data._id } } }, { $pull: { reactions: { user: data._id } } });
        if (profile) {
          res.send({ ...profile, ok: true });
        } else {
          const error = new Error(`profile with id ${req.params.id} not found`);
          error.httpStatusCode = 404;
          next(error);
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

//GET PROFILE WITH EXPERIENCE AS CV
profilesRouter.get("/:Id/CV", async (req, res, next) => {
  try {
    const id = req.params.Id;
    const profile = await ProfilesSchema.findById(id).select(["-password", "-email"]);
    const experiences = await ExperienceSchema.find({ user: id });
    if (profile) {
      const data = {
        name: profile.name + " " + profile.surname,
        title: profile.title,
        bio: profile.bio,
        area: profile.area,
        image: profile.image,
        link: "https://linkedin-strive-fe.herokuapp.com/profile/" + profile.username,
        experience: experiences.map(
          (experience) => `
      <div class="mb-3 d-flex flex-column">
           <stong>${experience.company}</stong>
           <span> ${experience.role}</span>
           <span>${moment(experience.startDate).format("MMMM YYYY")}- ${experience.endDate ? moment(experience.endDate).format("MMMM YYYY") : "Present"}</span>
           <span class="text-muted">${experience.area}</span>
      </div>`
        ),
      };
      const pdf = await createPDF(data);
      console.log(pdf);
      if (pdf) {
        res.download(pdf, profile.username + "_CV.pdf");
      }
    } else {
      const error = new Error("User not found");
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next("While reading profiles list a problem occurred!");
  }
});
module.exports = profilesRouter;
