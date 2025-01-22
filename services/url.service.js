const { nanoid } = require("nanoid");
const UrlModel = require("../models/url.model");
const redis = require("../lib/redis");
const UAParser = require("ua-parser-js");
const AnalyticsModel = require("../models/analytics.model");

class UrlService {
  async createShortUrl(userId, originalUrl, topic, customAlias) {
    const shortId = customAlias || nanoid(8);

    if (customAlias) {
      const existingUrl = await UrlModel.findOne({ shortId: customAlias });
      if (existingUrl) {
        throw new Error("Custom alias already taken");
      }
    }

    const url = await UrlModel.create({
      _user: userId,
      originalUrl,
      shortId,
      topic,
    });

    await redis.set(`url:${shortId}`, originalUrl, "EX", 86400); // Cache for 1 day

    return {
      shortId: url.shortId,
      shortUrl: `${process.env.BASE_URL}/${url.shortId}`,
    };
  }

  async getOriginalUrlByShortId(shortId) {
    let originalUrl = await redis.get(`url:${shortId}`);
    let url;

    if (!originalUrl) {
      url = await UrlModel.findOne({ shortId });
      if (!url) {
        throw new Error("URL not found");
      }
      originalUrl = url.originalUrl;
      await redis.set(`url:${shortId}`, originalUrl, "EX", 86400); // Cache for 1 day
    } else {
      url = await UrlModel.findOne({ shortId });
    }

    return { originalUrl, url };
  }

  async recordAnalytics(urlId, userAgent, ipAddress) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    await AnalyticsModel.create({
      _url: urlId,
      ipAddress,
      userAgent,
      device: result.device.type || "desktop",
      os: result.os.name,
      browser: result.browser.name,
    });
  }

  async getUsersUrls(userId) {
    const urls = await UrlModel.find({ _user: userId }).sort({ createdAt: -1 });

    return Promise.all(
      urls.map(async (url) => {
        const clicks = await AnalyticsModel.countDocuments({ _url: url._id });
        const uniqueVisitors = await AnalyticsModel.distinct("ipAddress", {
          _url: url._id,
        }).then((visitors) => visitors.length);

        return {
          shortUrl: `${process.env.BASE_URL}/${url.shortId}`,
          originalUrl: url.originalUrl,
          topic: url.topic,
          clicks,
          uniqueVisitors,
          createdAt: url.createdAt,
        };
      })
    );
  }
}

module.exports = UrlService;
