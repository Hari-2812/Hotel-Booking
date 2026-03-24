const express = require('express');
const { body, param, query } = require('express-validator');

const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { getMyBookings, cancelBooking, modifyBooking, createManualBooking } = require('../controllers/bookingController');
const { createStripeIntent } = require('../controllers/paymentController');

const router = express.Router();

router.post(
  '/create',
  authMiddleware,
  [body('roomId').isMongoId(), body('checkIn').isISO8601(), body('checkOut').isISO8601(), body('guests').isInt({ min: 1, max: 20 }).toInt()],
  validateRequest(),
  createStripeIntent
);


router.post(
  '/reserve',
  authMiddleware,
  [body('roomId').isMongoId(), body('checkIn').isISO8601(), body('checkOut').isISO8601(), body('guests').isInt({ min: 1, max: 20 }).toInt()],
  validateRequest(),
  createManualBooking
);

router.get('/mine', authMiddleware, [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 50 })], validateRequest(), getMyBookings);
router.delete('/:id/cancel', authMiddleware, [param('id').isMongoId()], validateRequest(), cancelBooking);
router.put(
  '/:id/modify',
  authMiddleware,
  [param('id').isMongoId(), body('checkIn').isISO8601(), body('checkOut').isISO8601(), body('guests').isInt({ min: 1, max: 20 }).toInt()],
  validateRequest(),
  modifyBooking
);

module.exports = router;
