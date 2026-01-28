const express = require('express');
const router = express.Router();
const {
    getPatientProfile,
    createPatientProfile,
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

router
    .route('/')
    .get(protect, getPatientProfile)
    .post(protect, createPatientProfile);

module.exports = router;
