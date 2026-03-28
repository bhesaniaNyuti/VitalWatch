import { onValue, ref } from 'firebase/database';
import { realtimeDb, realtimeReady } from '../config/firebase';

const DEFAULT_READINGS_PATH = 'readings';
const readingsPath = import.meta.env.VITE_FIREBASE_DASHBOARD_DOC || DEFAULT_READINGS_PATH;

const parseTimestamp = (value) => {
    const raw = Number(value);
    if (!Number.isFinite(raw) || raw <= 0) return Date.now();

    // Accept seconds, milliseconds, or microseconds and normalize to milliseconds.
    const candidates = [raw, raw * 1000, raw / 1000];
    const minEpochMs = 946684800000; // 2000-01-01
    const maxEpochMs = 4102444800000; // 2100-01-01
    const plausible = candidates.filter((candidate) => candidate >= minEpochMs && candidate <= maxEpochMs);

    if (!plausible.length) return Date.now();

    const now = Date.now();
    return plausible.reduce((best, candidate) => {
        return Math.abs(candidate - now) < Math.abs(best - now) ? candidate : best;
    });
};

const toReadableTime = (timestamp) => {
    return new Date(parseTimestamp(timestamp)).toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const toRelativeTime = (timestamp) => {
    const diffMs = Date.now() - parseTimestamp(timestamp);
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
};

const formatTrendTime = (timestamp) => {
    return new Date(parseTimestamp(timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getSignalValue = (item) => {
    const signal = Number(item?.signal);
    if (Number.isFinite(signal)) return signal;
    const ir = Number(item?.ir);
    if (Number.isFinite(ir)) return ir;
    return 0;
};

const resolveBp = (item) => {
    const explicitSys = Number(item?.sys ?? item?.systolic);
    const explicitDia = Number(item?.dia ?? item?.diastolic);

    if (Number.isFinite(explicitSys) && Number.isFinite(explicitDia)) {
        return { sys: explicitSys, dia: explicitDia };
    }

    const [sysFromBp, diaFromBp] = String(item?.bp || '').split('/').map((part) => Number(part));
    if (Number.isFinite(sysFromBp) && Number.isFinite(diaFromBp)) {
        return { sys: sysFromBp, dia: diaFromBp };
    }

    return null;
};

const getBpCategory = (sys, dia) => {
    if (sys < 90 || dia < 60) return 'Low BP';
    if (sys >= 140 || dia >= 90) return 'High (Stage 2)';
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return 'High (Stage 1)';
    if (sys >= 120 && sys <= 129 && dia < 80) return 'Pre-high (Elevated)';
    if (sys >= 90 && sys <= 120 && dia >= 60 && dia <= 80) return 'Normal';
    return 'Normal';
};

const getStatus = (bpCategory) => {
    if (bpCategory === 'High (Stage 2)') return 'Critical';
    if (bpCategory === 'Normal') return 'Normal';
    return 'Warning';
};

const isReadingRecord = (item) => {
    if (!item || typeof item !== 'object') return false;
    return item.bpm !== undefined || item.signal !== undefined || item.ir !== undefined || item.sys !== undefined || item.systolic !== undefined;
};

const collectReadings = (node, path = '') => {
    if (!node) return [];

    if (Array.isArray(node)) {
        return node.flatMap((child, index) => collectReadings(child, `${path}/${index}`));
    }

    if (typeof node === 'object') {
        if (isReadingRecord(node)) {
            const segments = path.split('/').filter(Boolean);
            const patientId = segments[0];
            if (!patientId) return [];
            const readingId = segments[segments.length - 1] || patientId;
            return [{ id: patientId, readingId, item: node }];
        }

        return Object.entries(node).flatMap(([key, value]) => collectReadings(value, `${path}/${key}`));
    }

    return [];
};

const mapReadingsToPatients = (entries = []) => {
    if (!Array.isArray(entries)) return [];

    return entries.map(({ id, item }, index) => {
        const safeItem = item || {};
        const timestamp = parseTimestamp(safeItem.timestamp);
        const bp = resolveBp(safeItem);
        const sys = bp?.sys;
        const dia = bp?.dia;
        const hr = Number.isFinite(Number(safeItem.bpm)) ? Number(safeItem.bpm) : null;
        const bpCategory = Number.isFinite(sys) && Number.isFinite(dia) ? getBpCategory(sys, dia) : 'Unavailable';
        const status = Number.isFinite(sys) && Number.isFinite(dia) ? getStatus(bpCategory) : 'Unknown';
        const labelSeed = String(id).slice(-4).toUpperCase();
        const resolvedName = safeItem.name || safeItem.patientName || String(id);

        return {
            id: String(id || `UNK${String(index + 1).padStart(3, '0')}`),
            ini: labelSeed || `P${String(index + 1).padStart(2, '0')}`,
            name: String(resolvedName),
            age: Number.isFinite(Number(safeItem.age)) ? Number(safeItem.age) : 0,
            sex: safeItem.sex || 'Unknown',
            bg: safeItem.bg || '-',
            location: safeItem.location || '-',
            bp: Number.isFinite(sys) && Number.isFinite(dia) ? `${sys}/${dia}` : '-',
            sys,
            dia,
            bpCategory,
            hr,
            spo2: Number.isFinite(Number(safeItem.spo2)) ? Number(safeItem.spo2) : 0,
            glucose: Number.isFinite(Number(safeItem.glucose)) ? Number(safeItem.glucose) : 0,
            chol: Number.isFinite(Number(safeItem.chol)) ? Number(safeItem.chol) : 0,
            status,
            upd: toReadableTime(timestamp),
            department: safeItem.department || '-',
            registered: safeItem.registered || '-',
            appointment: Number.isFinite(Number(safeItem.appointment)) ? Number(safeItem.appointment) : 0,
            bed: safeItem.bed || '-',
            medHx: safeItem.medHx || '-',
            meds: safeItem.meds || '-',
            allergies: safeItem.allergies || '-',
            emergency: safeItem.emergency || '-',
            risk: safeItem.risk || bpCategory,
            timestamp,
            signal: getSignalValue(safeItem),
        };
    });
};

const buildAlertsFromPatients = (patients = []) => {
    const filtered = patients.filter((patient) => patient.status !== 'Normal');

    return filtered.slice(0, 10).map((patient, index) => ({
        id: index + 1,
        type: patient.status === 'Critical' ? 'critical' : 'warning',
        patient: patient.name,
        msg: `BP ${patient.bp} | HR ${patient.hr} bpm`,
        time: patient.upd,
        unread: true,
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
    if (!realtimeReady || !realtimeDb) {
        if (typeof onStatusChange === 'function') onStatusChange('fallback');
        return () => {};
    }

    const readingsRef = ref(realtimeDb, readingsPath);

    return onValue(
        readingsRef,
        (snapshot) => {
            const raw = snapshot.val() || {};
            const collected = collectReadings(raw)
                .map((entry) => ({
                    ...entry,
                    item: entry.item || {},
                    timestamp: parseTimestamp(entry.item?.timestamp),
                }))
                .sort((a, b) => a.timestamp - b.timestamp);

            const latestById = new Map();
            collected.forEach((entry) => {
                latestById.set(entry.id, entry);
            });

            const patients = mapReadingsToPatients(Array.from(latestById.values()));
            const bpTrend = collected.slice(-50).map((entry) => {
                const { sys, dia } = resolveBp(entry.item);
                return {
                    time: formatTrendTime(entry.timestamp),
                    sys,
                    dia,
                };
            });

            const payload = {
                bpTrend,
                patients,
                alerts: buildAlertsFromPatients(patients),
                patientHistory: normalizePatientHistory({}),
                devicesOnline: patients.length,
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
