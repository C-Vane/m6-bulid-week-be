const express = require("express");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const mongoose = require("mongoose");
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

route.post("/:id/upload", parser.single("image"), async (req, res, next) => {
  try {
    const newPost = {
      ...req.body,
      image: req.file.path,
    };

    const modifiedPost = await Post.findByIdAndUpdate(req.params.id, newPost, {
      useFindAndModify: false,
    });

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
    const allPost = await Post.find();
    res.status(200).send(allPost);
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
