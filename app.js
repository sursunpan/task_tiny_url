const express = require("express");
const createError = require("http-errors");
const mongoose = require("mongoose");
const authRoute = require("./api/auth.api");
const analyticsRoute = require("./api/analytics.api");
const urlRoute = require("./api/url.api");
const rateLimit = require("express-rate-limit");

require("./lib/redis");
require("dotenv").config();

const app = express();

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_CONNECTION_STRING);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(globalLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/auth", authRoute);
app.use("/analytics", analyticsRoute);
app.use("/url", urlRoute);

app.use((req, res, next) => {
  next(createError(404));
});

module.exports = app;
