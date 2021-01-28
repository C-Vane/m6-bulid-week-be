const express = require("express");
const { Mongoose, Types } = require("mongoose");

const CommentsSchema = require("./schema");

const commentsRouter = express.Router();

const { verifyToken } = require("../../utilities/errorHandler");

const jwt = require("jsonwebtoken");

const q2m = require("query-to-mongo");

const secretKey = process.env.TOKEN_SECRET;

/* commentsRouter.get("/", async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const comments = await CommentsSchema.find().sort({ createdAt: -1 }).skip(query.options.skip).limit(query.options.limit).populate("author", "name surname image title");
    const total = await Post.countDocuments();
    res.send(comments, total);
  } catch (error) {
    next(error);
  }
}); */

commentsRouter.get("/:postId", async (req, res, next) => {
  try {
    const id = req.params.postId;
    const query = q2m(req.query);
    const total = await CommentsSchema.countDocuments({ post: Types.ObjectId(id) });
    const comment = await CommentsSchema.find({ post: Types.ObjectId(id) })
      .sort({ createdAt: -1 })
      .skip(query.options.skip)
      .limit(query.options.limit)
      .populate("author", "name surname image title");
    const links = query.links("/", total);
    if (comment) {
      res.send({ total, links, comment });
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next("While reading comments list a problem occurred!");
  }
});

commentsRouter.post("/", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err && req.body.author !== data._id) res.sendStatus(403);
      else {
        const newcomment = new CommentsSchema(req.body);
        const { _id } = await newcomment.save();
        res.status(201).send(_id);
      }
    });
  } catch (error) {
    next(error);
  }
});

commentsRouter.put("/:id", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err) res.sendStatus(403);
      else {
        if (await CommentsSchema.findOne({ $and: [{ _id: req.params.id }, { author: data._id }] })) {
          const comment = await CommentsSchema.findByIdAndUpdate(req.params.id, req.body, {
            runValidators: true,
            new: true,
          });
          if (comment) {
            res.send(comment);
          } else {
            const error = new Error(`comment with id ${req.params.id} not found`);
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

commentsRouter.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    jwt.verify(req.token, secretKey, async (err, data) => {
      if (err) res.sendStatus(403);
      else {
        if (await CommentsSchema.findOne({ $and: [{ _id: req.params.id }, { author: data._id }] })) {
          const comment = await CommentsSchema.findByIdAndDelete(req.params.id);
          if (comment) {
            res.send({ ...comment, ok: true });
          } else {
            const error = new Error(`comment with id ${req.params.id} not found`);
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
module.exports = commentsRouter;
