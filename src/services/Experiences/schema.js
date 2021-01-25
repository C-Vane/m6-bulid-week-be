const { Schema, model } = require("mongoose");

const ExperienceSchema = new Schema(
  {
    role: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: false,
    }, 
    description: String,
    area: String,
    image: String,
    username: [
        {userId: Schema.Types.ObjectId, username: String, password: String},
    ],

  },
  {
    timestamps: true,
  }
);


const ExperienceModel = model("Experience", ExperienceSchema);

module.exports = ExperienceModel;
