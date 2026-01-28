const express = require('express');
const router = express.Router();
const { addBPReading, getBPReadings } = require('../controllers/bpController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getBPReadings).post(protect, addBPReading);

module.exports = router;
