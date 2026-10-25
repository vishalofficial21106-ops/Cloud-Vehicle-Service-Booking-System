const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

/**
 * @desc    Get all vehicles belonging to the logged-in customer
 * @route   GET /api/vehicles
 * @access  Private
 */
const getMyVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicles'
    });
  }
};

/**
 * @desc    Get a single vehicle by ID
 * @route   GET /api/vehicles/:id
 * @access  Private
 */
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check ownership or admin
    if (vehicle.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this vehicle'
      });
    }

    return res.status(200).json({
      success: true,
      vehicle
    });
  } catch (error) {
    console.error('Get vehicle by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle details'
    });
  }
};

/**
 * @desc    Add a new vehicle for the logged-in user
 * @route   POST /api/vehicles
 * @access  Private
 */
const createVehicle = async (req, res) => {
  try {
    const { vehicleType, make, model, year, licensePlate, fuelType, notes } = req.body;

    if (!make || !model || !year || !licensePlate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide make, model, year, and license plate'
      });
    }

    const vehicle = await Vehicle.create({
      user: req.user._id,
      vehicleType: vehicleType || 'Car',
      make: make.trim(),
      model: model.trim(),
      year: Number(year),
      licensePlate: licensePlate.trim().toUpperCase(),
      fuelType: fuelType || 'Petrol',
      notes: notes ? notes.trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      vehicle
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to register vehicle'
    });
  }
};

/**
 * @desc    Update vehicle details
 * @route   PUT /api/vehicles/:id
 * @access  Private
 */
const updateVehicle = async (req, res) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Ensure ownership or admin
    if (vehicle.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this vehicle'
      });
    }

    const { vehicleType, make, model, year, licensePlate, fuelType, notes } = req.body;

    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (make) vehicle.make = make.trim();
    if (model) vehicle.model = model.trim();
    if (year) vehicle.year = Number(year);
    if (licensePlate) vehicle.licensePlate = licensePlate.trim().toUpperCase();
    if (fuelType) vehicle.fuelType = fuelType;
    if (notes !== undefined) vehicle.notes = notes.trim();

    const updatedVehicle = await vehicle.save();

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update vehicle'
    });
  }
};

/**
 * @desc    Delete a vehicle
 * @route   DELETE /api/vehicles/:id
 * @access  Private
 */
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Ensure ownership or admin
    if (vehicle.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this vehicle'
      });
    }

    // Check if vehicle has active bookings
    const activeBookings = await Booking.countDocuments({
      vehicle: vehicle._id,
      status: { $in: ['Pending', 'Confirmed', 'In Progress'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle with active service bookings'
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Vehicle removed successfully'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle'
    });
  }
};

module.exports = {
  getMyVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
