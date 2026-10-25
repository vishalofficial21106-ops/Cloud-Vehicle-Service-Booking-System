const express = require('express');
const router = express.Router();
const {
  getMyVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');

// All vehicle routes are protected
router.use(protect);

router.route('/')
  .get(getMyVehicles)
  .post(createVehicle);

router.route('/:id')
  .get(getVehicleById)
  .put(updateVehicle)
  .delete(deleteVehicle);

module.exports = router;
