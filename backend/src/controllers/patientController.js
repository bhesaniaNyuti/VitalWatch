const Patient = require('../models/Patient');

exports.getPatientProfile = async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user._id });
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
        const patient = new Patient({
            user: req.user._id,
            dateOfBirth,
            gender,
            medicalHistory,
        });

        const createdPatient = await patient.save();
        res.status(201).json(createdPatient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
