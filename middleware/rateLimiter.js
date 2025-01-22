const rateLimit = require("express-rate-limit");
const redis = require("../lib/redis");

const RedisStore = {
  incr: async (key) => {
    const result = await redis.incr(key);
    await redis.expire(key, 60); // 1 minute expiry
    return result;
  },
  decr: async (key) => {
    return await redis.decr(key);
  },
  resetKey: async (key) => {
    return await redis.del(key);
  },
};

const createUrlLimiter = rateLimit({
  store: RedisStore,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 URL creations per window
  message:
    "Too many URLs created from this IP, please try again after 15 minutes",
});

const analyticsLimiter = rateLimit({
  store: RedisStore,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 analytics requests per window
  message:
    "Too many analytics requests from this IP, please try again after 5 minutes",
});

module.exports = { createUrlLimiter, analyticsLimiter };
