require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Service = require('./models/Service');
const Booking = require('./models/Booking');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB for Database Seeding...');
};

const seedData = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Service.deleteMany({});
    await Booking.deleteMany({});

    console.log('👤 Creating users...');
    // Create Admin user
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@cloudservice.com',
      password: 'admin123',
      phone: '+91 9876543210',
      role: 'admin',
      address: 'Cloud Service Workshop HQ, Auto City'
    });

    // Create Customer demo user
    const customer = await User.create({
      name: 'Rahul Sharma',
      email: 'demo@customer.com',
      password: 'customer123',
      phone: '+91 9123456780',
      role: 'customer',
      address: 'Flat 402, Green Valley Apartments, Mumbai'
    });

    console.log(`✅ Admin created: ${admin.email}`);
    console.log(`✅ Customer created: ${customer.email}`);

    console.log('🚗 Creating sample customer vehicles...');
    const vehicle1 = await Vehicle.create({
      user: customer._id,
      vehicleType: 'Car',
      make: 'Toyota',
      model: 'Camry Hybrid',
      year: 2022,
      licensePlate: 'MH-02-AX-1024',
      fuelType: 'Hybrid',
      notes: 'Clean interior, scheduled 20,000 km checkup due'
    });

    const vehicle2 = await Vehicle.create({
      user: customer._id,
      vehicleType: 'SUV',
      make: 'Hyundai',
      model: 'Creta SX(O)',
      year: 2023,
      licensePlate: 'MH-04-BZ-5588',
      fuelType: 'Diesel',
      notes: 'Brake squeak observed on downhill drives'
    });

    const vehicle3 = await Vehicle.create({
      user: customer._id,
      vehicleType: 'Bike',
      make: 'Royal Enfield',
      model: 'Hunter 350',
      year: 2024,
      licensePlate: 'MH-01-EE-3344',
      fuelType: 'Petrol',
      notes: 'Daily commuter bike'
    });

    console.log('🛠️ Creating service catalog packages...');
    const services = await Service.insertMany([
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
    ]);

    console.log('📅 Creating initial service bookings...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);

    await Booking.create([
      {
        user: customer._id,
        vehicle: vehicle1._id,
        service: services[0]._id, // Comprehensive Periodic Service
        bookingDate: tomorrow,
        timeSlot: '09:00 AM - 11:00 AM',
        status: 'Confirmed',
        totalAmount: services[0].basePrice,
        paymentStatus: 'Pending',
        paymentMethod: 'Cash on Delivery',
        customerNotes: 'Please check the front wiper blades as well.',
        adminNotes: 'Assigned to Senior Technician Amit'
      },
      {
        user: customer._id,
        vehicle: vehicle2._id,
        service: services[1]._id, // Brake Overhaul
        bookingDate: new Date(),
        timeSlot: '11:00 AM - 01:00 PM',
        status: 'In Progress',
        totalAmount: services[1].basePrice,
        paymentStatus: 'Pending',
        paymentMethod: 'Online / Card',
        customerNotes: 'Brake pedal feels spongy when pressed hard.',
        adminNotes: 'Rotors inspected, replacing front pads'
      },
      {
        user: customer._id,
        vehicle: vehicle3._id,
        service: services[4]._id, // Ceramic Wash
        bookingDate: yesterday,
        timeSlot: '02:00 PM - 04:00 PM',
        status: 'Completed',
        totalAmount: services[4].basePrice,
        paymentStatus: 'Paid',
        paymentMethod: 'UPI',
        customerNotes: 'First wash after long highway tour.',
        adminNotes: 'Service completed on time and customer notified'
      }
    ]);

    console.log('🎉 Database seeding completed successfully!');
    console.log('-------------------------------------------------------');
    console.log('🔑 Ready Demo Credentials:');
    console.log('   Admin:    admin@cloudservice.com  / admin123');
    console.log('   Customer: demo@customer.com   / customer123');
    console.log('-------------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    process.exit(1);
  }
};

seedData();
