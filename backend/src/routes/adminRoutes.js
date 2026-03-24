const express = require("express");
const { query } = require("express-validator");

const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const { listRooms, listUsers, listBookings, analytics, updateUserRole, deleteUser, createImageUploadSignature } = require("../controllers/adminController");
const { adminCancelBooking } = require("../controllers/bookingController");

const router = express.Router();

router.use(authMiddleware, requireRole(["admin"]));

router.get("/rooms", [query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 100 })], validateRequest(), listRooms);
router.get("/users", [query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 100 })], validateRequest(), listUsers);
router.get("/bookings", [query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 100 }), query("status").optional().isIn(["pending", "confirmed", "cancelled"])], validateRequest(), listBookings);

router.get(
  "/analytics",
  [query("from").optional().isISO8601(), query("to").optional().isISO8601()],
  validateRequest(),
  analytics
);

router.delete("/bookings/:id", [require("express-validator").param("id").isMongoId()], validateRequest(), adminCancelBooking);

router.put(
  "/users/:id/role",
  [require("express-validator").param("id").isMongoId(), require("express-validator").body("role").isIn(["user", "admin"])],
  validateRequest(),
  updateUserRole
);


router.post(
  "/cloudinary/signature",
  [require("express-validator").body("folder").optional().isString().trim().isLength({ min: 1, max: 120 })],
  validateRequest(),
  createImageUploadSignature
);

router.delete(
  "/users/:id",
  [require("express-validator").param("id").isMongoId()],
  validateRequest(),
  deleteUser
);

module.exports = router;

