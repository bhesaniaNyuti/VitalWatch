import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddPatientScreen.css';

const CONDITION_OPTIONS = ['Hypertension', 'Diabetes', 'Heart issues'];

const initialFormState = {
    patientId: `P-${Date.now()}`,
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

const AddPatientScreen = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        if (type === 'checkbox') {
            setFormData((current) => {
                const nextValues = checked
                    ? [...current.existingConditions, value]
                    : current.existingConditions.filter((item) => item !== value);
                return { ...current, existingConditions: nextValues };
            });
        } else {
            setFormData((current) => ({ ...current, [name]: value }));
        }

        setErrors((current) => ({ ...current, [name]: '' }));
        if (name === 'existingConditions') {
            setErrors((current) => ({ ...current, existingConditions: '' }));
        }
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!formData.fullName.trim()) nextErrors.fullName = 'Full name is required.';
        if (!formData.age) nextErrors.age = 'Age is required.';
        else if (Number(formData.age) < 1 || Number(formData.age) > 120) nextErrors.age = 'Enter a valid age.';
        if (!formData.gender) nextErrors.gender = 'Gender is required.';
        if (!formData.existingConditions.length) nextErrors.existingConditions = 'Select at least one condition.';
        if (!formData.emergencyContact.trim()) nextErrors.emergencyContact = 'Emergency contact is required.';
        if (!formData.assignedDoctor.trim()) nextErrors.assignedDoctor = 'Assigned doctor is required.';
        if (!formData.roomNumber.trim()) nextErrors.roomNumber = 'Room number is required.';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!validateForm()) return;

        navigate('/doctor-view', {
            state: { newPatientForm: formData },
            replace: true,
        });
    };

    return (
        <div className="add-patient-page">
            <header className="add-patient-header">
                <div>
                    <p className="add-patient-eyebrow">Doctor Dashboard</p>
                    <h1>Add Patient</h1>
                    <p className="add-patient-subtitle">Enter complete patient details and assign care team members.</p>
                </div>
                <Link to="/doctor-view" className="add-patient-back-btn">Back to Dashboard</Link>
            </header>

            <main className="add-patient-shell">
                <form className="add-patient-form" onSubmit={handleSubmit}>
                    <section className="add-patient-section">
                        <h2>Patient Details</h2>
                        <div className="form-grid two-col">
                            <div className="field-block">
                                <label>Patient ID (Auto-generated)</label>
                                <input type="text" value={formData.patientId} readOnly />
                            </div>
                            <div className="field-block">
                                <label>Full Name *</label>
                                <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter full name" />
                                {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                            </div>
                            <div className="field-block">
                                <label>Age *</label>
                                <input type="number" name="age" value={formData.age} onChange={handleChange} min="1" max="120" placeholder="Age" />
                                {errors.age && <span className="field-error">{errors.age}</span>}
                            </div>
                            <div className="field-block">
                                <label>Gender *</label>
                                <select name="gender" value={formData.gender} onChange={handleChange}>
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.gender && <span className="field-error">{errors.gender}</span>}
                            </div>
                            <div className="field-block">
                                <label>Height (cm)</label>
                                <input type="number" name="heightCm" value={formData.heightCm} onChange={handleChange} placeholder="e.g. 172" min="0" />
                            </div>
                            <div className="field-block">
                                <label>Weight (kg)</label>
                                <input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} placeholder="e.g. 68" min="0" />
                            </div>
                            <div className="field-block full-width">
                                <label>Existing Conditions (Hypertension / Diabetes / Heart issues) *</label>
                                <div className="condition-grid">
                                    {CONDITION_OPTIONS.map((condition) => (
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
                                {errors.existingConditions && <span className="field-error">{errors.existingConditions}</span>}
                            </div>
                            <div className="field-block full-width">
                                <label>Medications (especially BP-related)</label>
                                <textarea name="medications" value={formData.medications} onChange={handleChange} rows="3" placeholder="List medications" />
                            </div>
                        </div>
                    </section>

                    <section className="add-patient-section">
                        <h2>Care Assignment</h2>
                        <div className="form-grid two-col">
                            <div className="field-block">
                                <label>Emergency Contact Number *</label>
                                <input name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder="e.g. +91 9876543210" />
                                {errors.emergencyContact && <span className="field-error">{errors.emergencyContact}</span>}
                            </div>
                            <div className="field-block">
                                <label>Assigned Doctor 👨‍⚕️ *</label>
                                <input name="assignedDoctor" value={formData.assignedDoctor} onChange={handleChange} placeholder="e.g. Dr. Meera Iyer" />
                                {errors.assignedDoctor && <span className="field-error">{errors.assignedDoctor}</span>}
                            </div>
                            <div className="field-block">
                                <label>Assigned Nurse (Room-wise)</label>
                                <input name="assignedNurse" value={formData.assignedNurse} onChange={handleChange} placeholder="e.g. Nurse Anjali" />
                            </div>
                            <div className="field-block">
                                <label>Room number *</label>
                                <input name="roomNumber" value={formData.roomNumber} onChange={handleChange} placeholder="e.g. B-109" />
                                {errors.roomNumber && <span className="field-error">{errors.roomNumber}</span>}
                            </div>
                        </div>
                    </section>

                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={() => navigate('/doctor-view')}>Cancel</button>
                        <button type="submit" className="primary-btn">Save Patient</button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default AddPatientScreen;