const { randomUUID } = require('crypto');
const store = require('../data/inMemoryStore');

exports.getPatientProfile = async (req, res) => {
    try {
        const patient = store.patients.find((item) => item.user === req.user._id);
        if (patient) {
            res.json(patient);
        } else {
            res.status(404).json({ message: 'Patient profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createPatientProfile = async (req, res) => {
    const { dateOfBirth, gender, medicalHistory } = req.body;

    try {
        const existing = store.patients.find((item) => item.user === req.user._id);
        if (existing) {
            return res.status(400).json({ message: 'Patient profile already exists' });
        }

        const patient = {
            _id: randomUUID(),
            user: req.user._id,
            dateOfBirth,
            gender,
            medicalHistory: Array.isArray(medicalHistory) ? medicalHistory : [],
            createdAt: new Date().toISOString(),
        };

        store.patients.push(patient);

        res.status(201).json(patient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
