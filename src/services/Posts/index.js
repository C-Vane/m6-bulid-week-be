const express = require("express");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const mongoose = require("mongoose");
const { verifyToken } = require("../../utilities/errorHandler");
const jwt = require("jsonwebtoken");
// const fs = require("fs");
// const MongoClient = require("mongodb").MongoClient;
// const url = "mongodb://localhost:5001/";
// const Json2csvParser = require("json2csv").Parser;
// const PDFDocument = require("pdfkit");

const ObjectsToCsv = require("objects-to-csv");

const Post = require("./schema");

const route = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "linkedin",
    format: async (req, file) => "png" || "jpg",
    public_id: (req, file) => "image",
  },
});

const parser = multer({ storage: storage });

route.get("/json2csv", async (req, res, next) => {
  try {
    const allPost = await Post.find();

    const csv = new ObjectsToCsv(allPost);

    await csv.toDisk("test2.xlsx");

    res.status(200).send(csv);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// route.get("/pdf", async (req, res, next) => {
//   try {
//     const allPost = await Post.find();
//     const doc = new PDFDocument();
//     doc.text("HI VANESSA AND RABEA. OPEN THE PDF :) ");
//     doc.pipe(fs.createWriteStream("output4.pdf"));
//     doc.end();
//     res.status(200).send(allPost);
//   } catch (error) {
//     console.log(error);
//     next(error);
//   }
// });

route.post("/:id/upload", verifyToken, parser.single("image"), async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err) res.sendStatus(403);
      else {
        if (await Post.findOne({ $and: [{ _id: req.params.id }, { user: data._id }] })) {
          const modifiedPost = await Post.findByIdAndUpdate(
            req.params.id,
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
          res.status(200).send(modifiedPost);
        } else res.sendStatus(403);
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//<-------------------------------------------------^ Image Upload ^---------------------------------------------------->//
route.post("/", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err && req.body.user !== data._id) res.sendStatus(403);
      else {
        const myObj = {
          ...req.body,
          image: "https://miro.medium.com/max/10368/1*o8tTGo3vsocTKnCUyz0wHA.jpeg",
        };
        const newPost = new Post(myObj);
        await newPost.save();
        res.status(201).send(newPost);
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

route.get("/", async (req, res, next) => {
  try {
    const query = q2m(req.query);
    console.log(query);
    const total = await Post.countDocuments(req.query.search && { $text: { $search: req.query.search } });
    const allPost = await Post.find(req.query.search && { $text: { $search: req.query.search } })
      .sort({ createdAt: -1 })
      .skip(query.options.skip)
      .limit(query.options.limit)
      .populate("author", "name surname image title");
    const posts = allPost.map((post) => (post = { ...post, reactions: reactions.length }));
    res.status(200).send({ total, posts });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

route.get("/:id", async (req, res, next) => {
  try {
    const singlePost = await Post.findById(req.params.id).populate("author", "name surname image title").populate("reactions.user", "name surname image title");
    res.status(200).send(singlePost);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

route.put("/:id", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err) res.sendStatus(403);
      else {
        if (await Post.findOne({ $and: [{ _id: req.params.id }, { user: data._id }] })) {
          const modifiedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {
            useFindAndModify: false,
          });
          res.status(200).send(modifiedPost);
        } else res.sendStatus(403);
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

route.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err) res.sendStatus(403);
      else {
        if (await Post.findOne({ $and: [{ _id: req.params.id }, { user: data._id }] })) {
          await Post.findByIdAndDelete(req.params.id);
          res.status(200).send("POST DELETED");
        }
        res.sendStatus(403);
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = route;
