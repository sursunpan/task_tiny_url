const AnalyticsService = require("../../services/analytics.service");
const UrlModel = require("../../models/url.model");
const AnalyticsModel = require("../../models/analytics.model");
const redis = require("../../lib/redis");
const { subDays } = require("date-fns");

jest.mock("../../models/url.model");
jest.mock("../../models/analytics.model");
jest.mock("../../lib/redis");

describe("AnalyticsService", () => {
  let analyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = AnalyticsService.getInstance();
  });

  describe("getUrlAnalytics", () => {
    it("should return cached analytics if available", async () => {
      const mockCache = { totalClicks: 100, uniqueUsers: 50 };
      redis.get.mockResolvedValue(JSON.stringify(mockCache));
      UrlModel.findOne.mockResolvedValue({
        _id: "urlId1",
        shortId: "shortId1",
        _user: "userId1",
      });

      const result = await analyticsService.getUrlAnalytics(
        "shortId1",
        "userId1"
      );

      expect(redis.get).toHaveBeenCalledWith("analytics:urlId1");
      expect(result).toEqual(mockCache);
    });

    it("should calculate analytics if not cached", async () => {
      redis.get.mockResolvedValue(null);
      UrlModel.findOne.mockResolvedValue({
        _id: "urlId1",
        shortId: "shortId1",
        _user: "userId1",
      });

      AnalyticsModel.countDocuments.mockResolvedValue(100);
      AnalyticsModel.distinct.mockResolvedValue(["192.168.1.1", "192.168.1.2"]);
      AnalyticsModel.aggregate
        .mockResolvedValueOnce([
          { _id: "2023-12-01", count: 10 },
          { _id: "2023-12-02", count: 15 },
        ])
        .mockResolvedValueOnce([
          {
            _id: "Windows",
            uniqueClicks: 10,
            uniqueUsers: ["192.168.1.1", "192.168.1.2"],
          },
        ])
        .mockResolvedValueOnce([
          { _id: "Mobile", uniqueClicks: 8, uniqueUsers: ["192.168.1.4"] },
        ]);

      const result = await analyticsService.getUrlAnalytics(
        "shortId1",
        "userId1"
      );

      expect(result).toEqual({
        totalClicks: 100,
        uniqueUsers: 2,
        clicksByDate: [
          { date: "2023-12-01", clicks: 10 },
          { date: "2023-12-02", clicks: 15 },
        ],
        osType: [{ osName: "Windows", uniqueClicks: 10, uniqueUsers: 2 }],
        deviceType: [{ deviceName: "Mobile", uniqueClicks: 8, uniqueUsers: 1 }],
      });
    });
  });

  describe("getTopicAnalytics", () => {
    it("should return topic analytics for a user", async () => {
      UrlModel.find.mockResolvedValue([{ _id: "urlId1", shortId: "shortId1" }]);

      AnalyticsModel.countDocuments.mockResolvedValue(50);
      AnalyticsModel.distinct.mockResolvedValue(["192.168.1.1"]);
      AnalyticsModel.aggregate.mockResolvedValue([
        { _id: "2023-12-01", count: 5 },
        { _id: "2023-12-02", count: 10 },
      ]);

      const result = await analyticsService.getTopicAnalytics(
        "topic1",
        "userId1"
      );

      expect(result).toEqual({
        totalClicks: 50,
        uniqueUsers: 1,
        clicksByDate: [
          { date: "2023-12-01", clicks: 5 },
          { date: "2023-12-02", clicks: 10 },
        ],
        urls: [
          {
            shortUrl: `${process.env.BASE_URL}/shortId1`,
            totalClicks: 50,
            uniqueUsers: 1,
          },
        ],
      });
    });
  });

  describe("getOverallAnalytics", () => {
    it("should calculate overall analytics if not cached", async () => {
      redis.get.mockResolvedValue(null);
      UrlModel.find.mockResolvedValue([{ _id: "urlId1" }, { _id: "urlId2" }]);

      AnalyticsModel.countDocuments.mockResolvedValue(200);
      AnalyticsModel.distinct.mockResolvedValue(["192.168.1.1", "192.168.1.2"]);
      AnalyticsModel.aggregate
        .mockResolvedValueOnce([
          { _id: "2023-12-01", count: 50 },
          { _id: "2023-12-02", count: 150 },
        ])
        .mockResolvedValueOnce([
          { _id: "Windows", uniqueClicks: 100, uniqueUsers: ["192.168.1.1"] },
        ])
        .mockResolvedValueOnce([
          { _id: "Desktop", uniqueClicks: 100, uniqueUsers: ["192.168.1.2"] },
        ]);

      const result = await analyticsService.getOverallAnalytics("userId1");

      expect(result).toEqual({
        totalUrls: 2,
        totalClicks: 200,
        uniqueUsers: 2,
        clicksByDate: [
          { date: "2023-12-01", clicks: 50 },
          { date: "2023-12-02", clicks: 150 },
        ],
        osType: [{ osName: "Windows", uniqueClicks: 100, uniqueUsers: 1 }],
        deviceType: [
          { deviceName: "Desktop", uniqueClicks: 100, uniqueUsers: 1 },
        ],
      });
    });
  });

  describe("Caching Behavior", () => {
    it("should cache analytics results", async () => {
      redis.get.mockResolvedValue(null);
      UrlModel.findOne.mockResolvedValue({
        _id: "urlId1",
        shortId: "shortId1",
        _user: "userId1",
      });

      AnalyticsModel.countDocuments.mockResolvedValue(100);
      AnalyticsModel.distinct.mockResolvedValue(["192.168.1.1", "192.168.1.2"]);
      AnalyticsModel.aggregate.mockResolvedValue([]);

      const result = await analyticsService.getUrlAnalytics(
        "shortId1",
        "userId1"
      );

      expect(redis.set).toHaveBeenCalledWith(
        "analytics:urlId1",
        JSON.stringify(result),
        "EX",
        300
      );
    });
  });
});
