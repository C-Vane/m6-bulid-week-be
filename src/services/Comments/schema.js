const { Schema } = require("mongoose");
const mongoose = require("mongoose");

const CommentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Comments", CommentSchema);
