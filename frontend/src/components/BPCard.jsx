import React from 'react';

const BPCard = ({ systolic, diastolic, pulse }) => {
    return (
        <div className="bp-card">
            <h3>Blood Pressure</h3>
            <p>Systolic: {systolic}</p>
            <p>Diastolic: {diastolic}</p>
            <p>Pulse: {pulse}</p>
        </div>
    );
};

export default BPCard;
