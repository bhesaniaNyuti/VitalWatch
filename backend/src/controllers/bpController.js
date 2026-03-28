const { randomUUID } = require('crypto');
const store = require('../data/inMemoryStore');

exports.addBPReading = async (req, res) => {
    const { systolic, diastolic, pulse } = req.body;

    try {
        const patient = store.patients.find((item) => item.user === req.user._id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const reading = {
            _id: randomUUID(),
            patient: patient._id,
            systolic: Number(systolic),
            diastolic: Number(diastolic),
            pulse: Number(pulse),
            timestamp: new Date().toISOString(),
        };

        store.bpReadings.push(reading);

        res.status(201).json(reading);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBPReadings = async (req, res) => {
    try {
        const patient = store.patients.find((item) => item.user === req.user._id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const readings = store.bpReadings
            .filter((item) => item.patient === patient._id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json(readings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
