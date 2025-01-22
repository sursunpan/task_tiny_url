const axios = require("axios");
const jwt = require("jsonwebtoken");

class AuthService {
  constructor(UserModel) {
    this.UserModel = UserModel;
    this.googleApiUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
  }

  async getGoogleUserInfo(accessToken) {
    try {
      const response = await axios({
        url: this.googleApiUrl,
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      throw new Error("Failed to fetch Google user info");
    }
  }

  async findOrCreateGoogleUser(googleUserInfo) {
    const {
      id: googleID,
      name: googleName,
      email: googleEmail,
      picture: avatar,
    } = googleUserInfo;

    if (!googleID) {
      throw new Error("Couldn't access the social account");
    }

    const query = this._buildGoogleQuery(googleID, googleEmail);
    let user = await this.UserModel.findOne(query);

    if (!user) {
      user = await this.UserModel.create({
        googleId: googleID,
        name: googleName || "User",
        picture: avatar || "",
        emails: googleEmail,
      });
    }

    return user;
  }

  generateAuthToken(user) {
    const payload = {
      id: user._id,
      _id: user._id,
      fullName: user.name,
      emails: user.emails,
    };

    return jwt.sign(payload, process.env.APP_SECRET, {
      expiresIn: "30d", // 30 days
    });
  }

  _buildGoogleQuery(googleID, email) {
    if (email) {
      return {
        $or: [{ googleID }, { emails: email }],
      };
    }
    return { googleID };
  }
}

module.exports = AuthService;
