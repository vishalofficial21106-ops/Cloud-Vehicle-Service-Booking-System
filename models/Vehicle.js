const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: ['Car', 'Bike', 'SUV', 'Truck'],
      default: 'Car'
    },
    make: {
      type: String,
      required: [true, 'Vehicle brand/make is required (e.g. Toyota, Honda)'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required (e.g. Corolla, Civic)'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Manufacturing year is required'],
      min: [1980, 'Year must be 1980 or later'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the distant future']
    },
    licensePlate: {
      type: String,
      required: [true, 'License plate number is required'],
      trim: true,
      uppercase: true
    },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
      default: 'Petrol'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
