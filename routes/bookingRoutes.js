const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelMyBooking,
  getAllBookings,
  updateBookingStatus,
  getAdminStats
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All booking routes require authentication
router.use(protect);

// Customer specific booking routes
router.get('/my', getMyBookings);
router.post('/', createBooking);
router.put('/:id/cancel', cancelMyBooking);

// Admin dashboard and statistics
router.get('/admin/stats', adminOnly, getAdminStats);
router.get('/', adminOnly, getAllBookings);
router.put('/:id/status', adminOnly, updateBookingStatus);

// View single booking (accessible by owner or admin)
router.get('/:id', getBookingById);

module.exports = router;
