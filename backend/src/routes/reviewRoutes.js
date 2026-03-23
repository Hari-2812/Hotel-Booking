const express = require("express");
const { body, param } = require("express-validator");

const { getReviewsForRoom, createReview } = require("../controllers/reviewController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");

const router = express.Router();

router.get("/:roomId", [param("roomId").isMongoId()], validateRequest(), getReviewsForRoom);

router.post(
  "/:roomId",
  authMiddleware,
  [
    param("roomId").isMongoId(),
    body("rating").isFloat({ min: 1, max: 5 }).toFloat(),
    body("comment").optional().isString().trim().isLength({ max: 1000 }),
  ],
  validateRequest(),
  createReview
);

module.exports = router;

