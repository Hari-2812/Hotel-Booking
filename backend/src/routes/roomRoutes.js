const express = require("express");
const { body, param } = require("express-validator");

const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  calcPrice,
} = require("../controllers/roomController");

const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");

const router = express.Router();

// ✅ GET ALL
router.get("/", getRooms);

// ✅ GET ONE
router.get(
  "/:id",
  [param("id").isMongoId()],
  validateRequest,
  getRoom
);

// ✅ CREATE
router.post(
  "/",
  authMiddleware,
  requireRole(["admin"]),
  [
    body("hotelName").isString().notEmpty(),
    body("location").isString().notEmpty(),
    body("basePricePerNight").isNumeric(),
    body("maxGuests").isNumeric(),
  ],
  validateRequest,
  createRoom
);

// ✅ UPDATE
router.put(
  "/:id",
  authMiddleware,
  requireRole(["admin"]),
  [param("id").isMongoId()],
  validateRequest,
  updateRoom
);

// ✅ DELETE
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["admin"]),
  [param("id").isMongoId()],
  validateRequest,
  deleteRoom
);

// ✅ PRICE CALC
router.post(
  "/calc-price",
  [
    body("roomId").isMongoId(),
    body("checkIn").isISO8601(),
    body("checkOut").isISO8601(),
  ],
  validateRequest,
  calcPrice
);

module.exports = router;