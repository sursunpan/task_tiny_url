const rateLimit = require("express-rate-limit");
const CustomRedisStore = require("../lib/redisStore");

const createUrlLimiter = rateLimit({
  store: new CustomRedisStore(15 * 60 * 1000),
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    "Too many URLs created from this IP, please try again after 15 minutes",
});

const analyticsLimiter = rateLimit({
  store: new CustomRedisStore(5 * 60 * 1000),
  windowMs: 5 * 60 * 1000,
  max: 100,
  message:
    "Too many analytics requests from this IP, please try again after 5 minutes",
});

module.exports = { createUrlLimiter, analyticsLimiter };
