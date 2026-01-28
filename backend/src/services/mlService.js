// Placeholder for ML Service
exports.predictHealthRisk = (bpData) => {
    // Mock prediction logic
    const { systolic, diastolic } = bpData;
    if (systolic > 140 || diastolic > 90) {
        return 'High Risk';
    } else if (systolic > 120 || diastolic > 80) {
        return 'Moderate Risk';
    }
    return 'Low Risk';
};
