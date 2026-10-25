const Service = require('../models/Service');

// Default initial service packages for quick startup / seeding
const DEFAULT_SERVICES = [
  {
    name: 'Comprehensive Periodic Service',
    description: 'Engine oil replacement, oil filter change, air filter cleaning, 40-point vehicle safety checkup, coolant top-up, and brake inspection.',
    category: 'Periodic Maintenance',
    estimatedTime: '3 - 4 Hours',
    basePrice: 2499,
    applicableVehicles: ['Car', 'SUV', 'Truck'],
    icon: 'fa-oil-can',
    isPopular: true,
    isActive: true
  },
  {
    name: 'Brake Disc & Pad Overhaul',
    description: 'Front and rear brake pad check/replacement, disc rotor resurfacing, brake fluid flush, and ABS sensor diagnostic test.',
    category: 'Brakes & Suspension',
    estimatedTime: '2 Hours',
    basePrice: 1899,
    applicableVehicles: ['Car', 'Bike', 'SUV', 'Truck'],
    icon: 'fa-shield-halved',
    isPopular: true,
    isActive: true
  },
  {
    name: 'High-Performance Engine Tuning',
    description: 'Spark plug replacement, fuel injector ultrasonic cleaning, throttle body servicing, and computerized ECU engine diagnostics.',
    category: 'Engine & Transmission',
    estimatedTime: '4 - 5 Hours',
    basePrice: 3499,
    applicableVehicles: ['Car', 'Bike', 'SUV'],
    icon: 'fa-gauge-high',
    isPopular: false,
    isActive: true
  },
  {
    name: 'Climate Control AC & Cabin Sanitization',
    description: 'Eco-friendly AC gas recharge (R134a/R1234yf), cooling coil antibacterial treatment, cabin filter change, and leak detection test.',
    category: 'AC & Electrical',
    estimatedTime: '2 - 3 Hours',
    basePrice: 1599,
    applicableVehicles: ['Car', 'SUV', 'Truck'],
    icon: 'fa-fan',
    isPopular: true,
    isActive: true
  },
  {
    name: 'Diamond Ceramic Wash & Spa Detailing',
    description: 'Snow foam shampoo wash, deep interior steam extraction, dashboard UV polish, 3-layer exterior ceramic gloss coat and tire dressing.',
    category: 'Detailing & Wash',
    estimatedTime: '3 Hours',
    basePrice: 1299,
    applicableVehicles: ['Car', 'Bike', 'SUV'],
    icon: 'fa-sparkles',
    isPopular: true,
    isActive: true
  },
  {
    name: 'Pre-Purchase & Highway Safety Inspection',
    description: 'Complete 60-point mechanical, electrical, suspension, battery health, and chassis structural integrity inspection report.',
    category: 'Inspection & Diagnostics',
    estimatedTime: '1.5 Hours',
    basePrice: 999,
    applicableVehicles: ['Car', 'Bike', 'SUV', 'Truck'],
    icon: 'fa-clipboard-check',
    isPopular: false,
    isActive: true
  }
];

/**
 * @desc    Get all active service packages
 * @route   GET /api/services
 * @access  Public
 */
const getAllServices = async (req, res) => {
  try {
    const { category, vehicleType, search } = req.query;
    let query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (vehicleType) {
      query.applicableVehicles = vehicleType;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let services = await Service.find(query).sort({ isPopular: -1, createdAt: -1 });

    // Auto-seed default services if collection is completely empty
    if (services.length === 0 && !category && !search && !vehicleType) {
      const count = await Service.countDocuments();
      if (count === 0) {
        await Service.insertMany(DEFAULT_SERVICES);
        services = await Service.find(query).sort({ isPopular: -1, createdAt: -1 });
      }
    }

    return res.status(200).json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    console.error('Get services error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve service packages'
    });
  }
};

/**
 * @desc    Get single service package details
 * @route   GET /api/services/:id
 * @access  Public
 */
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service package not found'
      });
    }

    return res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    console.error('Get service by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve service package details'
    });
  }
};

/**
 * @desc    Create a new service package
 * @route   POST /api/services
 * @access  Private (Admin only)
 */
const createService = async (req, res) => {
  try {
    const { name, description, category, estimatedTime, basePrice, applicableVehicles, icon, isPopular } = req.body;

    if (!name || !description || !basePrice) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and base price are required'
      });
    }

    const service = await Service.create({
      name: name.trim(),
      description: description.trim(),
      category: category || 'Periodic Maintenance',
      estimatedTime: estimatedTime || '2 - 3 Hours',
      basePrice: Number(basePrice),
      applicableVehicles: applicableVehicles || ['Car', 'Bike', 'SUV', 'Truck'],
      icon: icon || 'fa-wrench',
      isPopular: isPopular === true || isPopular === 'true'
    });

    return res.status(201).json({
      success: true,
      message: 'Service package created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create service'
    });
  }
};

/**
 * @desc    Update service package
 * @route   PUT /api/services/:id
 * @access  Private (Admin only)
 */
const updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service package not found'
      });
    }

    const fields = ['name', 'description', 'category', 'estimatedTime', 'basePrice', 'applicableVehicles', 'icon', 'isPopular', 'isActive'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        service[field] = req.body[field];
      }
    });

    const updatedService = await service.save();

    return res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      service: updatedService
    });
  } catch (error) {
    console.error('Update service error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update service'
    });
  }
};

/**
 * @desc    Delete or deactivate service package
 * @route   DELETE /api/services/:id
 * @access  Private (Admin only)
 */
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service package not found'
      });
    }

    // Soft delete by setting isActive to false
    service.isActive = false;
    await service.save();

    return res.status(200).json({
      success: true,
      message: 'Service deactivated successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate service'
    });
  }
};

/**
 * @desc    Seed initial service packages
 * @route   POST /api/services/seed
 * @access  Public
 */
const seedServices = async (req, res) => {
  try {
    await Service.deleteMany({});
    const created = await Service.insertMany(DEFAULT_SERVICES);

    return res.status(201).json({
      success: true,
      message: 'Initial service catalog seeded successfully',
      count: created.length,
      services: created
    });
  } catch (error) {
    console.error('Seed services error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to seed services'
    });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  seedServices
};
