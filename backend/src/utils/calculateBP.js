exports.calculateMAP = (systolic, diastolic) => {
    return diastolic + (systolic - diastolic) / 3;
};
