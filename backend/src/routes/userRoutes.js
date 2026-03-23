const express = require("express");
const { body, param } = require("express-validator");

const { authMiddleware } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const { getMe, getWishlist, addToWishlist, removeFromWishlist } = require("../controllers/userController");

const router = express.Router();

router.get("/me", authMiddleware, getMe);

router.get("/me/wishlist", authMiddleware, getWishlist);

router.post(
  "/me/wishlist",
  authMiddleware,
  [body("roomId").isMongoId()],
  validateRequest(),
  addToWishlist
);

router.delete(
  "/me/wishlist/:roomId",
  authMiddleware,
  [param("roomId").isMongoId()],
  validateRequest(),
  (req, res, next) => {
    req.body.roomId = req.params.roomId;
    next();
  },
  removeFromWishlist
);

module.exports = router;

