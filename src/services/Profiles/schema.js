const { Schema, model } = require("mongoose");
const validateEmail = function (email) {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: "Name is required",
      minlength: 2,
    },
    surname: {
      type: String,
      required: "Surname is required",
      minlength: 2,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: "Email address is required",
      validate: [validateEmail, "Please fill a valid email address"],
    },
    bio: String,
    title: String,
    area: String,
    image: {
      type: String,
      required: true,
    },
    background: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: "User name is required",
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = model("User", UserSchema);

module.exports = UserModel;
