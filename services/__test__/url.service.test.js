const { nanoid } = require("nanoid");
const UrlService = require("../url.service");
const UrlModel = require("../../models/url.model");
const redis = require("../../lib/redis");
const AnalyticsModel = require("../../models/analytics.model");
const UAParser = require("ua-parser-js");

jest.mock("nanoid");
jest.mock("../../models/url.model");
jest.mock("../../lib/redis");
jest.mock("../../models/analytics.model");
jest.mock("ua-parser-js");

describe("UrlService", () => {
  const urlService = new UrlService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createShortUrl", () => {
    test("should create a short URL with a custom alias", async () => {
      UrlModel.findOne.mockResolvedValue(null);
      UrlModel.create.mockResolvedValue({
        shortId: "customAlias",
      });
      redis.set.mockResolvedValue(true);

      const result = await urlService.createShortUrl(
        "userId",
        "https://example.com",
        "tech",
        "customAlias"
      );

      expect(UrlModel.findOne).toHaveBeenCalledWith({ shortId: "customAlias" });
      expect(UrlModel.create).toHaveBeenCalledWith({
        _user: "userId",
        originalUrl: "https://example.com",
        shortId: "customAlias",
        topic: "tech",
      });
      expect(redis.set).toHaveBeenCalledWith(
        "url:customAlias",
        "https://example.com",
        "EX",
        86400
      );
      expect(result).toEqual({
        shortId: "customAlias",
        shortUrl: `${process.env.BASE_URL}/customAlias`,
      });
    });

    test("should throw an error if custom alias is already taken", async () => {
      UrlModel.findOne.mockResolvedValue({});

      await expect(
        urlService.createShortUrl(
          "userId",
          "https://example.com",
          "tech",
          "customAlias"
        )
      ).rejects.toThrow("Custom alias already taken");
    });

    test("should generate a short URL if no custom alias is provided", async () => {
      nanoid.mockReturnValue("short1234");
      UrlModel.create.mockResolvedValue({
        shortId: "short1234",
      });
      redis.set.mockResolvedValue(true);

      const result = await urlService.createShortUrl(
        "userId",
        "https://example.com",
        "tech"
      );

      expect(UrlModel.create).toHaveBeenCalledWith({
        _user: "userId",
        originalUrl: "https://example.com",
        shortId: "short1234",
        topic: "tech",
      });
      expect(result).toEqual({
        shortId: "short1234",
        shortUrl: `${process.env.BASE_URL}/short1234`,
      });
    });
  });

  describe("getOriginalUrlByShortId", () => {
    test("should return the original URL from cache", async () => {
      redis.get.mockResolvedValue("https://example.com");
      UrlModel.findOne.mockResolvedValue({});

      const result = await urlService.getOriginalUrlByShortId("short1234");

      expect(redis.get).toHaveBeenCalledWith("url:short1234");
      expect(result).toEqual({ originalUrl: "https://example.com", url: {} });
    });

    test("should fetch the URL from DB if not cached", async () => {
      redis.get.mockResolvedValue(null);
      UrlModel.findOne.mockResolvedValue({
        originalUrl: "https://example.com",
      });
      redis.set.mockResolvedValue(true);

      const result = await urlService.getOriginalUrlByShortId("short1234");

      expect(UrlModel.findOne).toHaveBeenCalledWith({ shortId: "short1234" });
      expect(redis.set).toHaveBeenCalledWith(
        "url:short1234",
        "https://example.com",
        "EX",
        86400
      );
      expect(result).toEqual({
        originalUrl: "https://example.com",
        url: { originalUrl: "https://example.com" },
      });
    });

    test("should throw an error if the URL is not found", async () => {
      redis.get.mockResolvedValue(null);
      UrlModel.findOne.mockResolvedValue(null);

      await expect(
        urlService.getOriginalUrlByShortId("short1234")
      ).rejects.toThrow("URL not found");
    });
  });

  describe("recordAnalytics", () => {
    test("should record analytics with user agent and IP address", async () => {
      const mockResult = {
        device: { type: "mobile" },
        os: { name: "iOS" },
        browser: { name: "Safari" },
      };
      UAParser.mockImplementation(() => ({
        getResult: () => mockResult,
      }));
      AnalyticsModel.create.mockResolvedValue(true);

      await urlService.recordAnalytics(
        "urlId",
        "user-agent-string",
        "127.0.0.1"
      );

      expect(AnalyticsModel.create).toHaveBeenCalledWith({
        _url: "urlId",
        ipAddress: "127.0.0.1",
        userAgent: "user-agent-string",
        device: "mobile",
        os: "iOS",
        browser: "Safari",
      });
    });
  });

  describe("getUsersUrls", () => {
    it("should return all URLs for a user with analytics data", async () => {
      // Mock data for URLs
      UrlModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          {
            _id: "urlId1",
            _user: "userId",
            originalUrl: "https://example.com/1",
            shortId: "shortId1",
            topic: "topic1",
            createdAt: new Date(),
          },
          {
            _id: "urlId2",
            _user: "userId",
            originalUrl: "https://example.com/2",
            shortId: "shortId2",
            topic: "topic2",
            createdAt: new Date(),
          },
        ]),
      });

      // Mock data for analytics
      AnalyticsModel.countDocuments.mockResolvedValue(10);
      AnalyticsModel.distinct.mockResolvedValue(["192.168.1.1", "192.168.1.2"]);

      const result = await urlService.getUsersUrls("userId");

      expect(UrlModel.find).toHaveBeenCalledWith({ _user: "userId" });
      expect(AnalyticsModel.countDocuments).toHaveBeenCalledTimes(2);
      expect(AnalyticsModel.distinct).toHaveBeenCalledTimes(2);

      expect(result).toEqual([
        {
          shortUrl: `${process.env.BASE_URL}/shortId1`,
          originalUrl: "https://example.com/1",
          topic: "topic1",
          clicks: 10,
          uniqueVisitors: 2,
          createdAt: expect.any(Date),
        },
        {
          shortUrl: `${process.env.BASE_URL}/shortId2`,
          originalUrl: "https://example.com/2",
          topic: "topic2",
          clicks: 10,
          uniqueVisitors: 2,
          createdAt: expect.any(Date),
        },
      ]);
    });
  });
});
