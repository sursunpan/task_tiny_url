const UrlService = require("../services/url.service");
const urlService = new UrlService();

module.exports = {
  async createShortUrl(req, res) {
    try {
      const { originalUrl, topic, customAlias } = req.body;
      const { id: userId } = req.user;

      const result = await urlService.createShortUrl(
        userId,
        originalUrl,
        topic,
        customAlias
      );

      return res.status(200).json({
        error: false,
        message: "Shortened URL created successfully",
        shortUrl: result.shortUrl,
      });
    } catch (err) {
      return res.status(400).json({
        error: true,
        message: err.message,
      });
    }
  },

  async redirectToUrl(req, res) {
    try {
      const { shortId } = req.params;
      const { originalUrl, url } = await urlService.getOriginalUrlByShortId(
        shortId
      );

      await urlService.recordAnalytics(
        url._id,
        req.headers["user-agent"],
        req.ip
      );

      return res.redirect(originalUrl);
    } catch (err) {
      const status = err.message === "URL not found" ? 404 : 500;
      return res.status(status).json({
        error: true,
        message: err.message,
      });
    }
  },

  async usersUrl(req, res) {
    try {
      const { id: userId } = req.user;
      const urls = await urlService.getUsersUrls(userId);

      return res.status(200).json({
        error: false,
        urls,
      });
    } catch (err) {
      return res.status(500).json({
        error: true,
        message: err.message,
      });
    }
  },
};
