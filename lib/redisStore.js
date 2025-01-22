const redisClient = require("./redis");

class CustomRedisStore {
  constructor(windowMs) {
    this.client = redisClient;
    this.windowMs = windowMs;
  }

  async increment(key) {
    const ttl = Math.ceil(this.windowMs / 1000);
    const currentHits = await this.client.incr(key);

    if (currentHits === 1) {
      await this.client.expire(key, ttl);
    }

    const ttlInMs = (await this.client.ttl(key)) * 1000;
    return {
      totalHits: currentHits,
      resetTime: new Date(Date.now() + ttlInMs),
    };
  }

  async decrement(key) {
    const currentHits = await this.client.decr(key);
    return currentHits;
  }

  async resetKey(key) {
    await this.client.del(key);
  }
}

module.exports = CustomRedisStore;
