const axios = require("axios");
const jwt = require("jsonwebtoken");
const AuthService = require("../auth.service");

jest.mock("axios");
jest.mock("jsonwebtoken");

describe("AuthService", () => {
  let authService;
  let UserModelMock;

  beforeEach(() => {
    UserModelMock = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    authService = new AuthService(UserModelMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getGoogleUserInfo", () => {
    test("should return user info when API call is successful", async () => {
      const mockData = {
        id: "123",
        name: "Test User",
        email: "test@example.com",
      };
      axios.mockResolvedValue({ data: mockData });

      const accessToken = "validAccessToken";
      const result = await authService.getGoogleUserInfo(accessToken);

      expect(axios).toHaveBeenCalledWith({
        url: authService.googleApiUrl,
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      expect(result).toEqual(mockData);
    });

    test("should throw an error when API call fails", async () => {
      axios.mockRejectedValue(new Error("API error"));

      await expect(
        authService.getGoogleUserInfo("invalidToken")
      ).rejects.toThrow("Failed to fetch Google user info");
    });
  });

  describe("findOrCreateGoogleUser", () => {
    test("should find an existing user", async () => {
      const mockUser = {
        _id: "1",
        googleId: "123",
        emails: "test@example.com",
      };
      UserModelMock.findOne.mockResolvedValue(mockUser);

      const googleUserInfo = { id: "123", email: "test@example.com" };
      const result = await authService.findOrCreateGoogleUser(googleUserInfo);

      expect(UserModelMock.findOne).toHaveBeenCalledWith({
        $or: [{ googleID: "123" }, { emails: "test@example.com" }],
      });
      expect(result).toEqual(mockUser);
    });

    test("should create a new user when no existing user is found", async () => {
      UserModelMock.findOne.mockResolvedValue(null);
      const mockUser = {
        _id: "1",
        googleId: "123",
        emails: "test@example.com",
      };
      UserModelMock.create.mockResolvedValue(mockUser);

      const googleUserInfo = {
        id: "123",
        email: "test@example.com",
        name: "New User",
        picture: "avatar_url",
      };
      const result = await authService.findOrCreateGoogleUser(googleUserInfo);

      expect(UserModelMock.findOne).toHaveBeenCalledWith({
        $or: [{ googleID: "123" }, { emails: "test@example.com" }],
      });
      expect(UserModelMock.create).toHaveBeenCalledWith({
        googleId: "123",
        name: "New User",
        picture: "avatar_url",
        emails: "test@example.com",
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw an error when googleID is missing", async () => {
      const googleUserInfo = { email: "test@example.com" };

      await expect(
        authService.findOrCreateGoogleUser(googleUserInfo)
      ).rejects.toThrow("Couldn't access the social account");
    });
  });

  describe("generateAuthToken", () => {
    test("should generate a JWT token for the user", () => {
      const mockUser = {
        _id: "1",
        name: "Test User",
        emails: "test@example.com",
      };
      const mockToken = "mockToken";
      jwt.sign.mockReturnValue(mockToken);

      const result = authService.generateAuthToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser._id,
          _id: mockUser._id,
          fullName: mockUser.name,
          emails: mockUser.emails,
        },
        process.env.APP_SECRET,
        { expiresIn: "30d" }
      );
      expect(result).toBe(mockToken);
    });
  });

  describe("_buildGoogleQuery", () => {
    test("should return query with googleID and email when email is provided", () => {
      const result = authService._buildGoogleQuery("123", "test@example.com");
      expect(result).toEqual({
        $or: [{ googleID: "123" }, { emails: "test@example.com" }],
      });
    });

    it("should return query with only googleID when email is not provided", () => {
      const result = authService._buildGoogleQuery("123", null);
      expect(result).toEqual({ googleID: "123" });
    });
  });
});
