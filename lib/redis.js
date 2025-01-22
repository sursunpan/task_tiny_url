const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || "",
});

redis.on("connect", () => {
  // eslint-disable-next-line no-console
  // console.log("Connected to Redis");
});

redis.on("error", (err) => {
  // eslint-disable-next-line no-console
  // console.error("Redis connection error:", err);
  process.exit(1);
});

module.exports = redis;
