const mongoose = require('mongoose');

const bpReadingSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    systolic: {
        type: Number,
        required: true,
    },
    diastolic: {
        type: Number,
        required: true,
    },
    pulse: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const BPReading = mongoose.model('BPReading', bpReadingSchema);
module.exports = BPReading;
