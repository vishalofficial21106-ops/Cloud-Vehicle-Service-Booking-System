# 🚗 Cloud Vehicle Service Booking & Management System

A full-stack, cloud-ready Vehicle Service Booking and Workshop Management web application built with **Node.js**, **Express**, **MongoDB (Mongoose)**, and a **responsive Vanilla JavaScript frontend**.

Designed for automobile service centers, garages, and vehicle owners to streamline service scheduling, vehicle records management, status tracking, and administrative operations.

---

## 🌟 Key Features

### 👤 Customer Experience
- **User Authentication**: Secure JWT-based registration and login with bcrypt password encryption.
- **Vehicle Garage / Management**: Add and manage multiple vehicles (Cars, SUVs, Bikes, Trucks) with license plate, model, year, and fuel specifications.
- **Service Catalog Browsing**: Explore categorized maintenance packages with pricing, estimated durations, and descriptions.
- **Interactive Service Booking**: Book appointments with preferred time slots, vehicle selection, and customizable customer notes.
- **Live Status Tracking**: Monitor service booking progress (*Pending*, *Confirmed*, *In Progress*, *Completed*, *Cancelled*).
- **Service History**: View past bookings, costs, and payment methods.

### 🛠️ Admin & Workshop Operations
- **Workshop Analytics & Metrics**: View total bookings, revenue, pending jobs, and active vehicles at a glance.
- **Booking Management**: Accept, assign technicians, update job statuses, and add internal repair notes.
- **Service Catalog Management**: Add or toggle active service packages, update pricing, and adjust labor times.
- **Customer Oversight**: View customer records and assigned vehicle histories.

### 🛡️ Architecture & Security
- **JWT Authentication** stored via secure browser storage with Bearer token authorization middleware.
- **Role-Based Access Control (RBAC)** ensuring customers and administrators access appropriate endpoints.
- **RESTful API Design**: Clean separation of concerns with controllers, models, and modular routing.
- **Environment Agnostic**: Supports both local MongoDB instances and MongoDB Atlas Cloud clusters.

---

## 📂 Project Structure

```
vehical-service-booking-system/
├── config/
│   └── db.js                 # MongoDB connection handler
├── controllers/
│   ├── authController.js     # User registration, login, and profile
│   ├── bookingController.js  # Booking creation, updates, and filtering
│   ├── serviceController.js  # Service catalog CRUD
│   └── vehicleController.js  # Customer vehicle management
├── middleware/
│   └── authMiddleware.js     # JWT token verification & role enforcement
├── models/
│   ├── Booking.js            # Booking schema (user, vehicle, service, status, payment)
│   ├── Service.js            # Service package schema (price, duration, vehicle applicability)
│   ├── User.js               # User schema with password hashing
│   └── Vehicle.js            # Vehicle registration schema
├── public/                   # Frontend assets
│   ├── css/
│   │   ├── auth.css          # Auth styling
│   │   ├── dashboard.css     # Customer & Admin dashboard styling
│   │   └── style.css         # Core global styles, navbar & components
│   ├── js/
│   │   ├── admin-dashboard.js
│   │   ├── api.js            # Central API client
│   │   ├── auth.js           # Frontend auth handling
│   │   ├── book-service.js   # Booking workflow script
│   │   ├── customer-dashboard.js
│   │   └── my-bookings.js
│   ├── admin-dashboard.html  # Workshop Admin Portal
│   ├── book-service.html     # Appointment scheduling page
│   ├── customer-dashboard.html# Customer portal
│   ├── index.html            # Landing / Homepage
│   ├── login.html            # Authentication page
│   ├── my-bookings.html      # Service booking history & tracker
│   └── register.html         # User sign-up page
├── routes/
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── serviceRoutes.js
│   └── vehicleRoutes.js
├── .env.example              # Template for environment configuration
├── .gitignore                # Git exclusions
├── package.json              # Project dependencies and npm scripts
├── seed.js                   # Database seed script with sample data
└── server.js                 # Express server entry point
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local Community Server or MongoDB Atlas cloud cluster)

### 1. Clone the Repository
```bash
git clone https://github.com/visha/Cloud-Vehicle-Service-Booking-System.git
cd Cloud-Vehicle-Service-Booking-System
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update the `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/cloud_vehicle_service
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

### 4. Seed Sample Data (Optional)
Populate the database with demo users, vehicles, service catalogs, and active bookings:
```bash
npm run seed
```

#### Demo Credentials:
- **Admin**: `admin@cloudservice.com` | `admin123`
- **Customer**: `demo@customer.com` | `customer123`

### 5. Start the Application
Run in development mode (with nodemon):
```bash
npm run dev
```
Or start standard production mode:
```bash
npm start
```

Access the application in your browser at:
`http://localhost:5000`

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new customer account | Public |
| `POST` | `/api/auth/login` | Authenticate user & get JWT token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Private |
| `GET` | `/api/services` | Retrieve list of active services | Public |
| `POST` | `/api/services` | Create new service offering | Admin |
| `GET` | `/api/vehicles` | List current customer's vehicles | Customer |
| `POST` | `/api/vehicles` | Register a new vehicle | Customer |
| `GET` | `/api/bookings` | List user bookings (or all if admin) | Private |
| `POST` | `/api/bookings` | Create new service booking | Customer |
| `PUT` | `/api/bookings/:id/status`| Update booking status / remarks | Admin |
| `GET` | `/api/health` | Service health check | Public |

---

## 📜 License
This project is licensed under the ISC License.
