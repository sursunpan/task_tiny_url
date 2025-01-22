const { subDays } = require("date-fns");

const UrlModel = require("../models/url.model");
const AnalyticsModel = require("../models/analytics.model");
const redis = require("../lib/redis");

class AnalyticsService {
  static instance;
  CACHE_EXPIRY = 300; // 5 minutes

  constructor() {}

  static getInstance() {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async getCachedData(key) {
    const cachedData = await redis.get(key);
    return cachedData ? JSON.parse(cachedData) : null;
  }

  async setCachedData(key, data) {
    await redis.set(key, JSON.stringify(data), "EX", this.CACHE_EXPIRY);
  }

  async getBasicAnalytics(urlIds, sevenDaysAgo) {
    return Promise.all([
      AnalyticsModel.countDocuments({ _url: { $in: urlIds } }),
      AnalyticsModel.distinct("ipAddress", { _url: { $in: urlIds } }).then(
        (distinctIps) => distinctIps.length
      ),
      AnalyticsModel.aggregate([
        {
          $match: {
            _url: { $in: urlIds },
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);
  }

  async getDeviceAndOsStats(urlIds) {
    return Promise.all([
      AnalyticsModel.aggregate([
        {
          $match: { _url: { $in: urlIds } },
        },
        {
          $group: {
            _id: "$os",
            uniqueClicks: { $sum: 1 },
            uniqueUsers: { $addToSet: "$ipAddress" },
          },
        },
      ]),
      AnalyticsModel.aggregate([
        {
          $match: { _url: { $in: urlIds } },
        },
        {
          $group: {
            _id: "$device",
            uniqueClicks: { $sum: 1 },
            uniqueUsers: { $addToSet: "$ipAddress" },
          },
        },
      ]),
    ]);
  }

  async getUrlAnalytics(shortId, userId) {
    const url = await UrlModel.findOne({ shortId, _user: userId });
    if (!url) {
      throw new Error("URL not found");
    }

    const cacheKey = `analytics:${url._id}`;
    const cachedData = await this.getCachedData(cacheKey);
    if (cachedData) return cachedData;

    const sevenDaysAgo = subDays(new Date(), 7);
    const [totalClicks, uniqueUsers, clicksByDate] =
      await this.getBasicAnalytics([url._id], sevenDaysAgo);
    const [osStats, deviceStats] = await this.getDeviceAndOsStats([url._id]);

    const result = {
      totalClicks,
      uniqueUsers,
      clicksByDate: clicksByDate.map((item) => ({
        date: item._id,
        clicks: item.count,
      })),
      osType: osStats.map((item) => ({
        osName: item._id,
        uniqueClicks: item.uniqueClicks,
        uniqueUsers: item.uniqueUsers.length,
      })),
      deviceType: deviceStats.map((item) => ({
        deviceName: item._id,
        uniqueClicks: item.uniqueClicks,
        uniqueUsers: item.uniqueUsers.length,
      })),
    };

    await this.setCachedData(cacheKey, result);
    return result;
  }

  async getTopicAnalytics(topic, userId) {
    const urls = await UrlModel.find({ _user: userId, topic });
    const urlIds = urls.map((url) => url._id);
    const sevenDaysAgo = subDays(new Date(), 7);

    const [totalClicks, uniqueUsers, clicksByDate] =
      await this.getBasicAnalytics(urlIds, sevenDaysAgo);

    const urlStats = await Promise.all(
      urls.map(async (url) => {
        const [clicks, visitors] = await Promise.all([
          AnalyticsModel.countDocuments({ _url: url._id }),
          AnalyticsModel.distinct("ipAddress", { _url: url._id }).then(
            (distinctIps) => distinctIps.length
          ),
        ]);
        return {
          shortUrl: `${process.env.BASE_URL}/${url.shortId}`,
          totalClicks: clicks,
          uniqueUsers: visitors,
        };
      })
    );

    return {
      totalClicks,
      uniqueUsers,
      clicksByDate: clicksByDate.map((item) => ({
        date: item._id,
        clicks: item.count,
      })),
      urls: urlStats,
    };
  }

  async getOverallAnalytics(userId) {
    const cacheKey = `analytics:overall:${userId}`;
    const cachedData = await this.getCachedData(cacheKey);
    if (cachedData) return cachedData;

    const urls = await UrlModel.find({ _user: userId });
    const urlIds = urls.map((url) => url._id);
    const sevenDaysAgo = subDays(new Date(), 7);

    const [totalClicks, uniqueUsers, clicksByDate] =
      await this.getBasicAnalytics(urlIds, sevenDaysAgo);
    const [osStats, deviceStats] = await this.getDeviceAndOsStats(urlIds);

    const result = {
      totalUrls: urls.length,
      totalClicks,
      uniqueUsers,
      clicksByDate: clicksByDate.map((item) => ({
        date: item._id,
        clicks: item.count,
      })),
      osType: osStats.map((item) => ({
        osName: item._id,
        uniqueClicks: item.uniqueClicks,
        uniqueUsers: item.uniqueUsers.length,
      })),
      deviceType: deviceStats.map((item) => ({
        deviceName: item._id,
        uniqueClicks: item.uniqueClicks,
        uniqueUsers: item.uniqueUsers.length,
      })),
    };

    await this.setCachedData(cacheKey, result);
    return result;
  }
}

module.exports = AnalyticsService;
