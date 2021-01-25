const { Schema, model } = require("mongoose")

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
          },
          surname: {
            type: String,
            required: true,
        },
          email: String,
          bio: String,
          title: String,
          area: String,
          image: String,
          username: {
              type: String,
              required: true,
          },
          password: {
            type: String,
            required: true,
          },
        
    },
    {
        timestamps: true,
    }
    )

    const UserModel = model("User", UserSchema)

    module.exports = UserModel