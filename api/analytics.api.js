const express = require("express");
const redis = require("../lib/redis");
const { expressjwt: jwt } = require("express-jwt");
const { analyticsLimiter } = require("../middleware/rateLimiter");
require("dotenv").config();

const AnalyticsService = require("../services/analytics.service");
const AnalyticsController = require("../controllers/analytics.controllers");
const UrlModel = require("../models/url.model");
const AnalyticsModel = require("../models/analytics.model");

const router = express.Router();

if (!process.env.APP_SECRET) {
  throw new Error("APP_SECRET environment variable is required");
}

const checkJwt = jwt({
  secret: process.env.APP_SECRET,
  algorithms: ["HS256"],
  requestProperty: "user",
});

const analyticsService = new AnalyticsService({
  UrlModel,
  AnalyticsModel,
  redis,
});

const analyticsController = new AnalyticsController(analyticsService);

router.get("/url/:shortId", checkJwt, analyticsLimiter, async (req, res) =>
  analyticsController.get(req, res)
);

router.get("/topic/:topic", checkJwt, analyticsLimiter, async (req, res) =>
  analyticsController.topic(req, res)
);

router.get("/overall", checkJwt, analyticsLimiter, async (req, res) =>
  analyticsController.overall(req, res)
);

module.exports = router;
