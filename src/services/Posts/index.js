const express = require("express");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const mongoose = require("mongoose");
const fs = require("fs");
// const MongoClient = require("mongodb").MongoClient;
// const url = "mongodb://localhost:5001/";
// const Json2csvParser = require("json2csv").Parser;
const PDFDocument = require("pdfkit");
const q2m = require("query-to-mongo");
// const fastcsv = require("fast-csv");
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

    // allPost.toArray(function (err, result) {
    //   if (err) throw err;
    //   console.log(result);
    // });

    const csv = new ObjectsToCsv(allPost);

    await csv.toDisk("test2.xlsx");

    // res.setHeader("Content-Disposition", "attachment; filename=test2.csv");
    res.writeHead(200, {
      "Content-Disposition": 'attachment; filename="file.xlsx"',
      "Transfer-Encoding": "chunked",
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    // const csvFields = ["_id", "username", "image", "user"];
    // const json2csvParser = new Json2csvParser({ csvFields });
    // const csv = json2csvParser.parse(allPost);

    res.status(200).download("test2.xlsx");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

route.get("/pdf", async (req, res, next) => {
  try {
    const allPost = await Post.find();
    const doc = new PDFDocument();
    doc.text("HI VANESSA AND RABEA. OPEN THE PDF :) ");
    doc.pipe(fs.createWriteStream("output3.pdf"));
    doc.end();
    res.status(200).send(allPost);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

route.post("/:id/upload", parser.single("image"), async (req, res, next) => {
  try {
    // const newPost = {
    //   ...req.body,
    //   image: req.file.path,
    // };

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
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//----Not yet done----///

//<-------------------------------------------------^ Image Upload ^---------------------------------------------------->//
route.post("/", async (req, res, next) => {
  try {
    const myObj = {
      ...req.body,
      image: "https://miro.medium.com/max/10368/1*o8tTGo3vsocTKnCUyz0wHA.jpeg",
    };
    const newPost = new Post(myObj);
    await newPost.save();
    res.status(201).send(newPost);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

route.get("/", async (req, res, next) => {
  try {
    const query = q2m(req.query);
    console.log(query);
    const total = await Post.countDocuments(query.criteria);
    const allPost = await Post.find(query.criteria)
      .sort({ createdAt: -1 })
      .skip(query.options.skip)
      .limit(query.options.limit);

    res.status(200).send({ total, allPost });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

route.get("/:id", async (req, res, next) => {
  try {
    const singlePost = await Post.findById(req.params.id);
    res.status(200).send(singlePost);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

route.put("/:id", async (req, res, next) => {
  try {
    const modifiedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {
      useFindAndModify: false,
    });
    res.status(200).send(modifiedPost);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

route.delete("/:id", async (req, res, next) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    res.status(200).send("POST DELETED");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = route;
