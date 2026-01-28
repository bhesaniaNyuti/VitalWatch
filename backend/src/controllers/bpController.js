const BPReading = require('../models/BPReading');
const Patient = require('../models/Patient');

exports.addBPReading = async (req, res) => {
    const { systolic, diastolic, pulse } = req.body;

    try {
        const patient = await Patient.findOne({ user: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const reading = new BPReading({
            patient: patient._id,
            systolic,
            diastolic,
            pulse,
        });

        const createdReading = await reading.save();
        res.status(201).json(createdReading);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBPReadings = async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const readings = await BPReading.find({ patient: patient._id }).sort({ timestamp: -1 });
        res.json(readings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
