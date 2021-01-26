const { Schema, model } = require("mongoose");

const ExperienceSchema = new Schema(
  {
    role: {
      type: String,
      required: "Please specify the role",
    },
    company: {
      type: String,
      required: "Company name is required",
    },
    startDate: {
        type: Date,
        required: "Input start date",
    },
    endDate: {
        type: Date,
        required: false,
    }, 
    description: String,
    area: String,
    image: String,
    username: { 
        type: Schema.Types.ObjectId, ref: "User",
        required: true,
    },
  },
  {
    timestamps: true,
  }
);


const ExperienceModel = model("Experience", ExperienceSchema);

module.exports = ExperienceModel;
