const express = require("express");
const { query, param } = require("express-validator");

const { authMiddleware } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const {
  dashboard,
  pricingInsights,
  recommendations,
  reviewSummary,
  search,
} = require("../controllers/aiController");

const router = express.Router();

router.get("/recommendations", recommendations);

router.get("/search", [query("query").isString().trim().notEmpty()], validateRequest(), search);

router.get("/pricing/:roomId", [param("roomId").isMongoId()], validateRequest(), pricingInsights);

router.get("/reviews/:roomId/summary", [param("roomId").isMongoId()], validateRequest(), reviewSummary);

router.get("/dashboard", authMiddleware, dashboard);

module.exports = router;
