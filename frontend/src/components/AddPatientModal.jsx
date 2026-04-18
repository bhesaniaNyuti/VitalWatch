import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './AddPatientModal.css';

const EXISTING_CONDITION_OPTIONS = ['Hypertension', 'Diabetes', 'Heart issues'];

const initialFormState = {
    fullName: '',
    age: '',
    gender: '',
    heightCm: '',
    weightKg: '',
    existingConditions: [],
    medications: '',
    emergencyContact: '',
    assignedDoctor: '',
    assignedNurse: '',
    roomNumber: '',
};

const AddPatientModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState(initialFormState);

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData((current) => {
                const currentValues = current.existingConditions || [];
                const nextValues = checked
                    ? [...currentValues, value]
                    : currentValues.filter((item) => item !== value);
                return {
                    ...current,
                    existingConditions: nextValues,
                };
            });
        } else {
            setFormData((current) => ({
                ...current,
                [name]: value,
            }));
        }

        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
        if (type === 'checkbox' && errors.existingConditions) {
            setErrors({ ...errors, existingConditions: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName || formData.fullName.trim() === '') {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.age) {
            newErrors.age = 'Age is required';
        } else if (formData.age < 1 || formData.age > 120) {
            newErrors.age = 'Please enter a valid age';
        }

        if (!formData.gender) {
            newErrors.gender = 'Gender is required';
        }

        if (!Array.isArray(formData.existingConditions) || !formData.existingConditions.length) {
            newErrors.existingConditions = 'Select at least one existing condition';
        }

        if (!formData.emergencyContact || formData.emergencyContact.trim() === '') {
            newErrors.emergencyContact = 'Emergency contact is required';
        } else if (!/^\+?[0-9\-\s]{8,15}$/.test(formData.emergencyContact.trim())) {
            newErrors.emergencyContact = 'Enter a valid contact number';
        }

        if (!formData.assignedDoctor || formData.assignedDoctor.trim() === '') {
            newErrors.assignedDoctor = 'Assigned doctor is required';
        }

        if (!formData.roomNumber || formData.roomNumber.trim() === '') {
            newErrors.roomNumber = 'Room number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit(formData);
            setFormData(initialFormState);
            setErrors({});
        }
    };

    const handleClose = () => {
        setFormData(initialFormState);
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
                    <div className="form-group">
                        <label htmlFor="patientId" className="form-label">
                            Patient ID (Auto-generated)
                        </label>
                        <input
                            type="text"
                            id="patientId"
                            name="patientId"
                            className="form-input"
                            value="Auto-generated on save"
                            readOnly
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="fullName" className="form-label">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                                placeholder="Enter full name"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                            {errors.fullName && (
                                <span className="error-text">{errors.fullName}</span>
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
                            <label htmlFor="gender" className="form-label">
                                Gender *
                            </label>
                            <select
                                id="gender"
                                name="gender"
                                className={`form-input form-select ${errors.gender ? 'input-error' : ''}`}
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.gender && (
                                <span className="error-text">{errors.gender}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="heightCm" className="form-label">
                                Height (cm)
                            </label>
                            <input
                                type="number"
                                id="heightCm"
                                name="heightCm"
                                className="form-input"
                                placeholder="e.g., 172"
                                value={formData.heightCm}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="weightKg" className="form-label">
                                Weight (kg)
                            </label>
                            <input
                                type="number"
                                id="weightKg"
                                name="weightKg"
                                className="form-input"
                                placeholder="e.g., 68"
                                value={formData.weightKg}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="roomNumber" className="form-label">
                                Room Number *
                            </label>
                            <input
                                type="text"
                                id="roomNumber"
                                name="roomNumber"
                                className={`form-input ${errors.roomNumber ? 'input-error' : ''}`}
                                placeholder="e.g., 101"
                                value={formData.roomNumber}
                                onChange={handleChange}
                            />
                            {errors.roomNumber && (
                                <span className="error-text">{errors.roomNumber}</span>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Existing Conditions (Hypertension / Diabetes / Heart issues) *
                        </label>
                        <div className="condition-grid">
                            {EXISTING_CONDITION_OPTIONS.map((condition) => (
                                <label key={condition} className="condition-option">
                                    <input
                                        type="checkbox"
                                        name="existingConditions"
                                        value={condition}
                                        checked={formData.existingConditions.includes(condition)}
                                        onChange={handleChange}
                                    />
                                    <span>{condition}</span>
                                </label>
                            ))}
                        </div>
                        {errors.existingConditions && (
                            <span className="error-text">{errors.existingConditions}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="medications" className="form-label">
                            Medications (especially BP-related)
                        </label>
                        <textarea
                            id="medications"
                            name="medications"
                            className="form-input form-textarea"
                            placeholder="List current medications"
                            value={formData.medications}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="emergencyContact" className="form-label">
                                Emergency Contact Number *
                            </label>
                            <input
                                type="text"
                                id="emergencyContact"
                                name="emergencyContact"
                                className={`form-input ${errors.emergencyContact ? 'input-error' : ''}`}
                                placeholder="e.g., +91 9876543210"
                                value={formData.emergencyContact}
                                onChange={handleChange}
                            />
                            {errors.emergencyContact && (
                                <span className="error-text">{errors.emergencyContact}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="assignedDoctor" className="form-label">
                                Assigned Doctor *
                            </label>
                            <input
                                type="text"
                                id="assignedDoctor"
                                name="assignedDoctor"
                                className={`form-input ${errors.assignedDoctor ? 'input-error' : ''}`}
                                placeholder="e.g., Dr. Meera Iyer"
                                value={formData.assignedDoctor}
                                onChange={handleChange}
                            />
                            {errors.assignedDoctor && (
                                <span className="error-text">{errors.assignedDoctor}</span>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="assignedNurse" className="form-label">
                            Assigned Nurse (Room-wise)
                        </label>
                        <input
                            type="text"
                            id="assignedNurse"
                            name="assignedNurse"
                            className="form-input"
                            placeholder="e.g., Nurse Anjali"
                            value={formData.assignedNurse}
                            onChange={handleChange}
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
