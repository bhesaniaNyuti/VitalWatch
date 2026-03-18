import { doc, onSnapshot } from 'firebase/firestore';
import { db, firebaseReady } from '../config/firebase';

const DEFAULT_DASHBOARD_DOC_PATH = 'dashboard/live';
const dashboardDocPath = import.meta.env.VITE_FIREBASE_DASHBOARD_DOC || DEFAULT_DASHBOARD_DOC_PATH;

const normalizePatients = (patients = []) => {
    if (!Array.isArray(patients)) return [];

    return patients.map((patient, index) => {
        const safePatient = patient || {};
        const sys = Number.isFinite(safePatient.sys) ? safePatient.sys : Number.parseInt(String(safePatient.bp || '').split('/')[0], 10) || 120;
        const dia = Number.isFinite(safePatient.dia) ? safePatient.dia : Number.parseInt(String(safePatient.bp || '').split('/')[1], 10) || 80;

        return {
            id: safePatient.id || `P${String(index + 1).padStart(3, '0')}`,
            ini: safePatient.ini || String(safePatient.name || 'NA').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'NA',
            name: safePatient.name || 'Unknown Patient',
            age: Number.isFinite(safePatient.age) ? safePatient.age : 0,
            sex: safePatient.sex || 'Unknown',
            bg: safePatient.bg || '-',
            location: safePatient.location || '-',
            bp: safePatient.bp || `${sys}/${dia}`,
            sys,
            dia,
            hr: Number.isFinite(safePatient.hr) ? safePatient.hr : 70,
            spo2: Number.isFinite(safePatient.spo2) ? safePatient.spo2 : 98,
            glucose: Number.isFinite(safePatient.glucose) ? safePatient.glucose : 95,
            chol: Number.isFinite(safePatient.chol) ? safePatient.chol : 150,
            status: safePatient.status || 'Normal',
            upd: safePatient.upd || 'just now',
            department: safePatient.department || 'General',
            registered: safePatient.registered || '-',
            appointment: Number.isFinite(safePatient.appointment) ? safePatient.appointment : 0,
            bed: safePatient.bed || '-',
            medHx: safePatient.medHx || '-',
            meds: safePatient.meds || '-',
            allergies: safePatient.allergies || '-',
            emergency: safePatient.emergency || '-',
            risk: safePatient.risk || '-',
        };
    });
};

const normalizeAlerts = (alerts = []) => {
    if (!Array.isArray(alerts)) return [];

    return alerts.map((alert, index) => ({
        id: alert?.id || index + 1,
        type: alert?.type || 'info',
        patient: alert?.patient || 'Unknown Patient',
        msg: alert?.msg || '-',
        time: alert?.time || 'now',
        unread: Boolean(alert?.unread),
    }));
};

const normalizePatientHistory = (history) => {
    if (!history) return {};

    if (Array.isArray(history)) {
        return history.reduce((acc, entry) => {
            if (!entry?.patientId) return acc;
            const patientId = entry.patientId;
            if (!acc[patientId]) acc[patientId] = [];
            acc[patientId].push({
                date: entry.date || '-',
                diagnosis: entry.diagnosis || '-',
                severity: entry.severity || 'Low',
                visits: Number.isFinite(entry.visits) ? entry.visits : 0,
                status: entry.status || 'Monitoring',
            });
            return acc;
        }, {});
    }

    if (typeof history === 'object') {
        return Object.entries(history).reduce((acc, [patientId, rows]) => {
            if (!Array.isArray(rows)) return acc;
            acc[patientId] = rows.map((row) => ({
                date: row?.date || '-',
                diagnosis: row?.diagnosis || '-',
                severity: row?.severity || 'Low',
                visits: Number.isFinite(row?.visits) ? row.visits : 0,
                status: row?.status || 'Monitoring',
            }));
            return acc;
        }, {});
    }

    return {};
};

export const subscribeLiveDashboard = (onData, onStatusChange) => {
    if (!firebaseReady || !db) {
        if (typeof onStatusChange === 'function') onStatusChange('fallback');
        return () => {};
    }

    const [collectionName, docId] = dashboardDocPath.split('/');
    if (!collectionName || !docId) {
        if (typeof onStatusChange === 'function') onStatusChange('fallback');
        return () => {};
    }

    const dashboardRef = doc(db, collectionName, docId);

    return onSnapshot(
        dashboardRef,
        (snapshot) => {
            if (!snapshot.exists()) {
                if (typeof onStatusChange === 'function') onStatusChange('fallback');
                return;
            }

            const data = snapshot.data() || {};
            const payload = {
                bpTrend: Array.isArray(data.bpTrend) ? data.bpTrend : undefined,
                patients: normalizePatients(data.patients),
                alerts: normalizeAlerts(data.alerts),
                patientHistory: normalizePatientHistory(data.patientHistory),
                devicesOnline: Number.isFinite(data.devicesOnline) ? data.devicesOnline : undefined,
            };

            if (typeof onData === 'function') onData(payload);
            if (typeof onStatusChange === 'function') onStatusChange('live');
        },
        (error) => {
            console.error('Firebase live subscription failed:', error);
            if (typeof onStatusChange === 'function') onStatusChange('error');
        }
    );
};
