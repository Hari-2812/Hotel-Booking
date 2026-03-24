const express = require("express");
const { query, param } = require("express-validator");

const { authMiddleware } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const {
  dashboard,
  pricingInsights,
  recommendations,
  search,
} = require("../controllers/aiController");

const router = express.Router();

// ✅ GET recommendations
router.get("/recommendations", recommendations);

// ✅ SMART SEARCH
router.get(
  "/search",
  [query("query").isString().trim().notEmpty()],
  validateRequest,
  search
);

// ✅ PRICING
router.get(
  "/pricing/:roomId",
  [param("roomId").isMongoId()],
  validateRequest,
  pricingInsights
);

// ✅ DASHBOARD (protected)
router.get("/dashboard", authMiddleware, dashboard);

module.exports = router;