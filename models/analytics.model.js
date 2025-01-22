const mongoose = require("mongoose");

const AnalyticsSchema = new mongoose.Schema({
  _url: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Url",
    required: true,
  },

  ipAddress: String,

  userAgent: String,

  device: {
    type: String,
    enum: ["desktop", "mobile", "tablet", "other"],
  },

  os: String,

  browser: String,
});

AnalyticsSchema.set("timestamps", true);
AnalyticsSchema.set("toJSON", { virtuals: true });
AnalyticsSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Analytics", AnalyticsSchema);
