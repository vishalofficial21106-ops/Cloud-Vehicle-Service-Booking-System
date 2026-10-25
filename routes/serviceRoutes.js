const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  seedServices
} = require('../controllers/serviceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public catalog routes
router.get('/', getAllServices);
router.post('/seed', seedServices);
router.get('/:id', getServiceById);

// Admin only service management routes
router.post('/', protect, adminOnly, createService);
router.put('/:id', protect, adminOnly, updateService);
router.delete('/:id', protect, adminOnly, deleteService);

module.exports = router;
