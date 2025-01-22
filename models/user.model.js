const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  emails: [
    {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
    },
  ],

  googleId: {
    type: String,
    required: true,
    unique: true,
  },

  name: String,

  picture: String,
});

UserSchema.set("timestamps", true);
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", UserSchema);
