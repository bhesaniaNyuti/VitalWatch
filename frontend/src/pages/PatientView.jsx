import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import BPCard from '../components/BPCard';

const PatientView = () => {
    return (
        <>
            <Navbar />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ flex: 1 }}>
                    <h1>Patient View</h1>
                    <BPCard systolic={120} diastolic={80} pulse={72} />
                </main>
            </div>
            <Footer />
        </>
    );
};

export default PatientView;
