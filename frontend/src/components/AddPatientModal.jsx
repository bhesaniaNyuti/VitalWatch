import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './AddPatientModal.css';

const AddPatientModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        room: '',
        gender: 'male',
        medicalHistory: ''
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name || formData.name.trim() === '') {
            newErrors.name = 'Patient name is required';
        }

        if (!formData.age) {
            newErrors.age = 'Age is required';
        } else if (formData.age < 1 || formData.age > 120) {
            newErrors.age = 'Please enter a valid age';
        }

        if (!formData.room || formData.room.trim() === '') {
            newErrors.room = 'Room number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit(formData);
            // Reset form
            setFormData({
                name: '',
                age: '',
                room: '',
                gender: 'male',
                medicalHistory: ''
            });
            setErrors({});
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            age: '',
            room: '',
            gender: 'male',
            medicalHistory: ''
        });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add New Patient</h2>
                    <button className="modal-close" onClick={handleClose}>
                        ✕
                    </button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name" className="form-label">
                                Patient Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className={`form-input ${errors.name ? 'input-error' : ''}`}
                                placeholder="Enter patient name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && (
                                <span className="error-text">{errors.name}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="age" className="form-label">
                                Age *
                            </label>
                            <input
                                type="number"
                                id="age"
                                name="age"
                                className={`form-input ${errors.age ? 'input-error' : ''}`}
                                placeholder="Age"
                                value={formData.age}
                                onChange={handleChange}
                                min="1"
                                max="120"
                            />
                            {errors.age && (
                                <span className="error-text">{errors.age}</span>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="room" className="form-label">
                                Room Number *
                            </label>
                            <input
                                type="text"
                                id="room"
                                name="room"
                                className={`form-input ${errors.room ? 'input-error' : ''}`}
                                placeholder="e.g., 101"
                                value={formData.room}
                                onChange={handleChange}
                            />
                            {errors.room && (
                                <span className="error-text">{errors.room}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="gender" className="form-label">
                                Gender
                            </label>
                            <select
                                id="gender"
                                name="gender"
                                className="form-input form-select"
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="medicalHistory" className="form-label">
                            Medical History (Optional)
                        </label>
                        <textarea
                            id="medicalHistory"
                            name="medicalHistory"
                            className="form-input form-textarea"
                            placeholder="Enter any relevant medical history..."
                            value={formData.medicalHistory}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Add Patient
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

AddPatientModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default AddPatientModal;
