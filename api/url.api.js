const express = require("express");
const { expressjwt: jwt } = require("express-jwt");
const UrlController = require("../controllers/url.controllers");
const { createUrlLimiter } = require("../middleware/rateLimiter");

require("dotenv").config();

const router = express.Router();

if (!process.env.APP_SECRET) {
  throw new Error("APP_SECRET environment variable is required");
}

const checkJwt = jwt({
  secret: process.env.APP_SECRET,
  algorithms: ["HS256"],
  requestProperty: "user",
});

router.post("/createurl", checkJwt, createUrlLimiter, async (req, res) =>
  UrlController.createShortUrl(req, res)
);
router.get("/redirect/:shortId", checkJwt, createUrlLimiter, async (req, res) =>
  UrlController.redirectToUrl(req, res)
);
router.get("/users/urls", checkJwt, createUrlLimiter, async (req, res) =>
  UrlController.usersUrl(req, res)
);

module.exports = router;
