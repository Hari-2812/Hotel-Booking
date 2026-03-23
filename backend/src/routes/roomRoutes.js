const express = require('express');
const { body, param } = require('express-validator');

const { getRooms, getRoom, createRoom, updateRoom, deleteRoom, calcPrice } = require('../controllers/roomController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', getRooms);
router.get('/:id', [param('id').isMongoId()], validateRequest(), getRoom);
router.post(
  '/',
  authMiddleware,
  requireRole(['admin']),
  [body('hotelName').isString().trim().notEmpty(), body('location').isString().trim().notEmpty(), body('basePricePerNight').isNumeric().toFloat(), body('maxGuests').isNumeric().toInt()],
  validateRequest(),
  createRoom
);
router.put('/:id', authMiddleware, requireRole(['admin']), [param('id').isMongoId()], validateRequest(), updateRoom);
router.delete('/:id', authMiddleware, requireRole(['admin']), [param('id').isMongoId()], validateRequest(), deleteRoom);
router.post('/calc-price', [body('roomId').isMongoId(), body('checkIn').isISO8601(), body('checkOut').isISO8601()], validateRequest(), calcPrice);

module.exports = router;
