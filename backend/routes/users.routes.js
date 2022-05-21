const usersController = require("../controllers/user.controller");

const express = require("express");
const router = express.Router();

router.post("/login", usersController.otpLogin);
router.post("/verify", usersController.verifyOTP);

module.exports = router;