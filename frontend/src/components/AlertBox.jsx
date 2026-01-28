import React from 'react';

const AlertBox = ({ type, message }) => {
    return (
        <div className={`alert alert-${type}`}>
            {message}
        </div>
    );
};

export default AlertBox;
