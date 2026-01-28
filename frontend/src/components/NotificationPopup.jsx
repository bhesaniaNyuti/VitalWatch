import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const NotificationPopup = ({ alert, onClose }) => {
    const { patientName, patientId, systolic, diastolic, timestamp, type } = alert;

    // Auto-dismiss after 10 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 10000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const getAlertIcon = () => {
        return type === 'high' ? '📈' : '📉';
    };

    const getAlertTitle = () => {
        return type === 'high' ? 'High BP Alert' : 'Low BP Alert';
    };

    const getTimeAgo = () => {
        if (!timestamp) return 'Just now';
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        return `${Math.floor(seconds / 3600)} hour ago`;
    };

    return (
        <div className="notification-popup">
            <div className={`notification-card notification-${type}`}>
                <button className="notification-close" onClick={onClose}>
                    ✕
                </button>

                <div className="notification-header">
                    <div className="notification-icon">
                        {getAlertIcon()}
                    </div>
                    <div className="notification-content">
                        <div className="notification-title">{getAlertTitle()}</div>
                        <div className="notification-patient">
                            {patientName} (ID: {patientId})
                        </div>
                    </div>
                </div>

                <div className="notification-details">
                    <div className="notification-bp">
                        <span className="alert-icon">⚠️</span>
                        <span className="bp-reading">{systolic}/{diastolic} mmHg</span>
                    </div>
                    <div className="notification-time">
                        <span className="time-icon">🕐</span>
                        {getTimeAgo()}
                    </div>
                </div>
            </div>
        </div>
    );
};

NotificationPopup.propTypes = {
    alert: PropTypes.shape({
        patientName: PropTypes.string.isRequired,
        patientId: PropTypes.string.isRequired,
        systolic: PropTypes.number.isRequired,
        diastolic: PropTypes.number.isRequired,
        timestamp: PropTypes.string,
        type: PropTypes.oneOf(['high', 'low']).isRequired
    }).isRequired,
    onClose: PropTypes.func.isRequired
};

export default NotificationPopup;
