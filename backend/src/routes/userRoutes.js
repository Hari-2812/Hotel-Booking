const express = require('express');
const { body, param } = require('express-validator');

const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { getMe, getWishlist, addToWishlist, removeFromWishlist, getDashboard, saveRecentSearch } = require('../controllers/userController');

const router = express.Router();

router.get('/me', authMiddleware, getMe);
router.get('/me/dashboard', authMiddleware, getDashboard);
router.post('/me/searches', authMiddleware, [body('query').isString().trim().isLength({ min: 2, max: 140 })], validateRequest(), saveRecentSearch);
router.get('/me/wishlist', authMiddleware, getWishlist);
router.post('/me/wishlist', authMiddleware, [body('roomId').isMongoId()], validateRequest(), addToWishlist);
router.delete('/me/wishlist/:roomId', authMiddleware, [param('roomId').isMongoId()], validateRequest(), (req, res, next) => {
  req.body.roomId = req.params.roomId;
  next();
}, removeFromWishlist);

module.exports = router;
