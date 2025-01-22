class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async googleAuth(req, res) {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({
          error: true,
          message: "No Google Access Token Found!",
        });
      }

      const googleUserInfo = await this.authService.getGoogleUserInfo(
        accessToken
      );

      const user = await this.authService.findOrCreateGoogleUser(
        googleUserInfo
      );

      const token = this.authService.generateAuthToken(user);

      return res.status(200).json({
        error: false,
        message: "Google Auth Successful",
        token,
      });
    } catch (error) {
      const statusCode = this._determineStatusCode(error);
      return res.status(statusCode).json({
        error: true,
        message: error.message,
      });
    }
  }

  _determineStatusCode(error) {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes("token")) {
      return 401;
    }
    if (errorMessage.includes("access")) {
      return 403;
    }
    if (errorMessage.includes("not found")) {
      return 404;
    }
    return 500;
  }
}

module.exports = AuthController;
