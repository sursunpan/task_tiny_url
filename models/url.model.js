const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  _user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  originalUrl: {
    type: String,
    required: true,
  },

  shortId: {
    type: String,
    required: true,
    unique: true,
  },

  topic: {
    type: String,
    enum: ["acquisition", "activation", "retention", null],
    default: null,
  },
});

urlSchema.set("timestamps", true);
urlSchema.set("toJSON", { virtuals: true });
urlSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Url", urlSchema);
