const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service package name is required'],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      required: [true, 'Service description is required']
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Periodic Maintenance',
        'Brakes & Suspension',
        'Engine & Transmission',
        'AC & Electrical',
        'Detailing & Wash',
        'Inspection & Diagnostics'
      ],
      default: 'Periodic Maintenance'
    },
    estimatedTime: {
      type: String,
      default: '2 - 3 Hours'
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price must be non-negative']
    },
    applicableVehicles: {
      type: [String],
      enum: ['Car', 'Bike', 'SUV', 'Truck'],
      default: ['Car', 'Bike', 'SUV', 'Truck']
    },
    icon: {
      type: String,
      default: 'fa-wrench'
    },
    isPopular: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Service', serviceSchema);
