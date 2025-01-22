const AnalyticsService = require("../services/analytics.service");

class AnalyticsController {
  constructor() {
    this.analyticsService = AnalyticsService.getInstance();
  }

  get = async (req, res) => {
    try {
      const result = await this.analyticsService.getUrlAnalytics(
        req.params.shortId,
        req.user.id
      );
      return res.json({ error: false, result });
    } catch (err) {
      return res.status(err.message === "URL not found" ? 404 : 500).json({
        error: true,
        message: err.message,
      });
    }
  };

  topic = async (req, res) => {
    try {
      const result = await this.analyticsService.getTopicAnalytics(
        req.params.topic,
        req.user.id
      );
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  };

  overall = async (req, res) => {
    try {
      const result = await this.analyticsService.getOverallAnalytics(
        req.user.id
      );
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: true, message: err.message });
    }
  };
}

module.exports = AnalyticsController;
