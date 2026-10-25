const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Service = require('../models/Service');
const User = require('../models/User');

/**
 * @desc    Create a new vehicle service booking
 * @route   POST /api/bookings
 * @access  Private (Customer)
 */
const createBooking = async (req, res) => {
  try {
    const { vehicleId, serviceId, bookingDate, timeSlot, paymentMethod, customerNotes } = req.body;

    if (!vehicleId || !serviceId || !bookingDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please provide vehicle, service package, appointment date, and time slot'
      });
    }

    // Validate vehicle ownership
    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Selected vehicle was not found in your registered vehicles'
      });
    }

    // Validate service package
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Selected service package is not available'
      });
    }

    // Validate appointment date is not in the past
    const selectedDate = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past'
      });
    }

    // Create the booking
    const booking = await Booking.create({
      user: req.user._id,
      vehicle: vehicle._id,
      service: service._id,
      bookingDate: selectedDate,
      timeSlot,
      totalAmount: service.basePrice,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      paymentStatus: paymentMethod === 'Online / Card' || paymentMethod === 'UPI' ? 'Paid' : 'Pending',
      customerNotes: customerNotes ? customerNotes.trim() : '',
      status: 'Pending'
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('vehicle')
      .populate('service')
      .populate('user', 'name email phone');

    return res.status(201).json({
      success: true,
      message: 'Service appointment booked successfully!',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit service booking'
    });
  }
};

/**
 * @desc    Get all bookings for the currently logged-in user
 * @route   GET /api/bookings/my
 * @access  Private (Customer)
 */
const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { user: req.user._id };

    if (status && status !== 'All') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('vehicle')
      .populate('service')
      .sort({ bookingDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get customer bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your bookings'
    });
  }
};

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private (Owner or Admin)
 */
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('vehicle')
      .populate('service');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permission
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    return res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking details'
    });
  }
};

/**
 * @desc    Cancel a booking by customer
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private (Customer)
 */
const cancelMyBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify ownership
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if cancellation is allowed
    if (booking.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed service appointment'
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already cancelled'
      });
    }

    if (booking.status === 'In Progress') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is currently being serviced in workshop and cannot be cancelled'
      });
    }

    booking.status = 'Cancelled';
    if (booking.paymentStatus === 'Paid') {
      booking.paymentStatus = 'Refunded';
    }
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
};

/**
 * @desc    Get all bookings (Admin only) with filtering and search
 * @route   GET /api/bookings
 * @access  Private (Admin only)
 */
const getAllBookings = async (req, res) => {
  try {
    const { status, date, search } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.bookingDate = { $gte: startOfDay, $lte: endOfDay };
    }

    let bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('vehicle')
      .populate('service')
      .sort({ bookingDate: -1, createdAt: -1 });

    // In-memory filter for search across user name, vehicle model, or license plate
    if (search && search.trim() !== '') {
      const term = search.toLowerCase().trim();
      bookings = bookings.filter((b) => {
        const userName = b.user?.name?.toLowerCase() || '';
        const userEmail = b.user?.email?.toLowerCase() || '';
        const vehiclePlate = b.vehicle?.licensePlate?.toLowerCase() || '';
        const vehicleModel = b.vehicle?.model?.toLowerCase() || '';
        const serviceName = b.service?.name?.toLowerCase() || '';
        return (
          userName.includes(term) ||
          userEmail.includes(term) ||
          vehiclePlate.includes(term) ||
          vehicleModel.includes(term) ||
          serviceName.includes(term)
        );
      });
    }

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings list'
    });
  }
};

/**
 * @desc    Update booking status and notes (Admin only)
 * @route   PUT /api/bookings/:id/status
 * @access  Private (Admin only)
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { status, paymentStatus, adminNotes } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (status) {
      booking.status = status;
      // If completed and payment was pending with cash, auto mark paid if requested
      if (status === 'Completed' && booking.paymentMethod === 'Cash on Delivery') {
        booking.paymentStatus = 'Paid';
      }
    }

    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }

    if (adminNotes !== undefined) {
      booking.adminNotes = adminNotes.trim();
    }

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email phone address')
      .populate('vehicle')
      .populate('service');

    return res.status(200).json({
      success: true,
      message: `Booking updated to "${booking.status}" successfully`,
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update booking status'
    });
  }
};

/**
 * @desc    Get aggregate statistics for Admin Dashboard
 * @route   GET /api/bookings/admin/stats
 * @access  Private (Admin only)
 */
const getAdminStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'Pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'Confirmed' });
    const inProgressBookings = await Booking.countDocuments({ status: 'In Progress' });
    const completedBookings = await Booking.countDocuments({ status: 'Completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'Cancelled' });

    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalVehicles = await Vehicle.countDocuments();

    // Calculate total revenue from completed bookings
    const revenueResult = await Booking.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Recent 5 bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('vehicle', 'make model licensePlate')
      .populate('service', 'name basePrice')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        inProgressBookings,
        completedBookings,
        cancelledBookings,
        totalCustomers,
        totalVehicles,
        totalRevenue,
        recentBookings
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute dashboard metrics'
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelMyBooking,
  getAllBookings,
  updateBookingStatus,
  getAdminStats
};
