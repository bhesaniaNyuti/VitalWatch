import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const Dashboard = () => {
    return (
        <>
            <Navbar />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ flex: 1 }}>
                    <h1>Dashboard</h1>
                    <p>Welcome to your dashboard.</p>
                </main>
            </div>
            <Footer />
        </>
    );
};

export default Dashboard;
