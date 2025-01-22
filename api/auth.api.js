const express = require("express");

const AuthService = require("../services/auth.service");
const AuthController = require("../controllers/auth.controllers");

const UserModel = require("../models/user.model");

const router = express.Router();

const authService = new AuthService(UserModel);
const authController = new AuthController(authService);

router.post("/googleAuth", (req, res) => authController.googleAuth(req, res));

module.exports = router;
