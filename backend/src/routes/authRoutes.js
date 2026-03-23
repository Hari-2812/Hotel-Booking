const express = require("express");
const { body } = require("express-validator");

const { register, login } = require("../controllers/authController");
const { validateRequest } = require("../middleware/validateRequest");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").isString().trim().notEmpty().isLength({ min: 2, max: 80 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 8, max: 128 }),
  ],
  validateRequest(),
  register
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").isString().notEmpty()],
  validateRequest(),
  login
);

module.exports = router;

