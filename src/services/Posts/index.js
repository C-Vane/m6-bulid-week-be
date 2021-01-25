const express = require("express");
const mongoose = require("mongoose");
const Post = require("./schema");

const route = express.Router();

route.post("/", async (req, res, next) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = route;
