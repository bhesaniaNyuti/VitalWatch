import React from 'react';
import PropTypes from 'prop-types';

const PatientCard = ({ patient }) => {
    const {
        name,
        age,
        room,
        systolic,
        diastolic,
        pulse,
        status,
        trend,
        lastUpdate,
        isLive
    } = patient;

    // Get status class for styling
    const getStatusClass = () => {
        switch (status?.toLowerCase()) {
            case 'critical':
                return 'patient-card-critical';
            case 'elevated':
                return 'patient-card-elevated';
            case 'normal':
            default:
                return 'patient-card-normal';
        }
    };

    // Get badge class
    const getBadgeClass = () => {
        switch (status?.toLowerCase()) {
            case 'critical':
                return 'badge-critical';
            case 'elevated':
                return 'badge-elevated';
            case 'normal':
            default:
                return 'badge-normal';
        }
    };

    // Get avatar initial
    const getInitial = () => {
        return name ? name.charAt(0).toUpperCase() : 'P';
    };

    // Get trend icon
    const getTrendIcon = () => {
        if (trend === 'up') return '↗';
        if (trend === 'down') return '↘';
        return '—';
    };

    // Format time ago
    const getTimeAgo = () => {
        if (!lastUpdate) return 'Just now';
        const seconds = Math.floor((new Date() - new Date(lastUpdate)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    return (
        <div className={`patient-card ${getStatusClass()}`}>
            {/* Patient Header */}
            <div className="patient-card-header">
                <div className="patient-info-section">
                    <div className="patient-avatar">
                        {getInitial()}
                    </div>
                    <div className="patient-details">
                        <div className="patient-name">{name}</div>
                        <div className="patient-meta">
                            {age} yrs • Room {room}
                        </div>
                    </div>
                </div>
                <span className={`badge ${getBadgeClass()}`}>
                    {status}
                </span>
            </div>

            {/* BP Reading Section */}
            <div className="bp-reading-section">
                <div className="bp-label">
                    BLOOD PRESSURE
                    <span className="trend-icon">{getTrendIcon()}</span>
                </div>
                <div className="bp-values">
                    <span className="bp-systolic">{systolic}</span>
                    <span className="bp-separator">/</span>
                    <span className="bp-diastolic">{diastolic}</span>
                    <span className="bp-unit">mmHg</span>
                </div>
            </div>

            {/* Pulse Section */}
            <div className="pulse-section">
                <div className="pulse-label">
                    <span className="heart-icon">❤️</span>
                    Pulse
                </div>
                <div className="pulse-value">{pulse} BPM</div>
            </div>

            {/* Footer */}
            <div className="patient-card-footer">
                <div className="live-status">
                    {isLive && (
                        <>
                            <span className="live-indicator"></span>
                            <span className="live-text">Live</span>
                        </>
                    )}
                </div>
                <div className="last-update">
                    Updated {getTimeAgo()}
                </div>
            </div>
        </div>
    );
};

PatientCard.propTypes = {
    patient: PropTypes.shape({
        name: PropTypes.string.isRequired,
        age: PropTypes.number.isRequired,
        room: PropTypes.string.isRequired,
        systolic: PropTypes.number.isRequired,
        diastolic: PropTypes.number.isRequired,
        pulse: PropTypes.number.isRequired,
        status: PropTypes.oneOf(['Normal', 'Elevated', 'Critical']).isRequired,
        trend: PropTypes.oneOf(['up', 'down', 'stable']),
        lastUpdate: PropTypes.string,
        isLive: PropTypes.bool
    }).isRequired
};

export default PatientCard;
