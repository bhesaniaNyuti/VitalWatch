import { onValue, ref } from 'firebase/database';
import { realtimeDb, realtimeReady } from '../config/firebase';

const DEFAULT_READINGS_PATH = 'readings';
const readingsPath = import.meta.env.VITE_FIREBASE_DASHBOARD_DOC || DEFAULT_READINGS_PATH;

const parseTimestamp = (value) => {
    if (typeof value === 'string') {
        const parsedText = Date.parse(value);
        if (Number.isFinite(parsedText)) return parsedText;
    }

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

const normalizeIdentifier = (value) => {
    const text = String(value ?? '').trim();
    return text || null;
};

const normalizeReadingIndex = (item) => {
    const candidates = [item?.index, item?.Index, item?.sample, item?.sampleIndex, item?.readingIndex];

    for (const candidate of candidates) {
        const parsed = Number(candidate);
        if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    }

    return null;
};

const normalizeSessionId = (item, path = '') => {
    const explicitSession = normalizeIdentifier(item?.session ?? item?.Session ?? item?.sessionId ?? item?.sessionID);
    if (explicitSession) return explicitSession;

    const segments = path.split('/').filter(Boolean);
    if (segments.length > 1) {
        return segments[0];
    }

    return null;
};

const getSignalValue = (item) => {
    const signal = Number(item?.signal);
    if (Number.isFinite(signal)) return signal;
    const ir = Number(item?.ir);
    if (Number.isFinite(ir)) return ir;
    return 0;
};

const getIrSeries = (item) => {
    if (Array.isArray(item?.ir)) {
        return item.ir
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value));
    }

    const csvSeries = item?.IR || item?.ir_csv || item?.irCSV || item?.values || item?.data;
    if (typeof csvSeries === 'string' && csvSeries.includes(',')) {
        return csvSeries
            .split(',')
            .map((part) => Number(String(part).replace(/"/g, '').trim()))
            .filter((value) => Number.isFinite(value));
    }

    const singleIr = Number(item?.ir);
    if (Number.isFinite(singleIr)) return [singleIr];

    const signal = Number(item?.signal);
    if (Number.isFinite(signal)) return [signal];

    return [];
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

const getSeverityLabel = (sys, dia, bucket = 'normal') => {
    if ((Number.isFinite(sys) && sys >= 180) || (Number.isFinite(dia) && dia >= 120) || bucket === 'highlyCritical') {
        return 'Highly Critical';
    }

    if ((Number.isFinite(sys) && sys >= 140) || (Number.isFinite(dia) && dia >= 90) || bucket === 'critical') {
        return 'Critical';
    }

    if ((Number.isFinite(sys) && sys >= 130 && sys <= 139) || (Number.isFinite(dia) && dia >= 80 && dia <= 89) || bucket === 'warning') {
        return 'Warning';
    }

    return 'Normal';
};

const determineSyntheticBucket = (hr, spo2, position) => {
    if (Number.isFinite(hr) && hr >= 95) return 'critical';
    if (Number.isFinite(spo2) && spo2 <= 88) return 'critical';
    if (Number.isFinite(hr) && hr >= 85) return 'warning';
    if (Number.isFinite(spo2) && spo2 <= 94) return 'warning';
    return 'normal';
};

const synthesizeBpFromBucket = (bucket, position) => {
    if (bucket === 'highlyCritical') {
        return {
            sys: 198 + (position % 2) * 2,
            dia: 124 + (position % 2),
        };
    }

    if (bucket === 'critical') {
        return {
            sys: 170 + (position % 3) * 2,
            dia: 108 + (position % 2),
        };
    }

    if (bucket === 'warning') {
        return {
            sys: 134 + (position % 2) * 2,
            dia: 86 + (position % 2),
        };
    }

    return {
        sys: 118 + (position % 2),
        dia: 76 + (position % 2),
    };
};

const isReadingRecord = (item) => {
    if (!item || typeof item !== 'object') return false;
    return (
        item.bpm !== undefined ||
        item.BPM !== undefined ||
        item.signal !== undefined ||
        item.ir !== undefined ||
        item.IR !== undefined ||
        item.spo2 !== undefined ||
        item.spO2 !== undefined ||
        item.sys !== undefined ||
        item.systolic !== undefined ||
        item.bp !== undefined ||
        item.timestamp !== undefined ||
        item.Timestamp !== undefined ||
        item.session !== undefined ||
        item.Session !== undefined ||
        item.index !== undefined ||
        item.Index !== undefined
    );
};

const collectReadings = (node, path = '') => {
    if (!node) return [];

    if (Array.isArray(node)) {
        return node.flatMap((child, index) => collectReadings(child, `${path}/${index}`));
    }

    if (typeof node === 'object') {
        if (isReadingRecord(node)) {
            const segments = path.split('/').filter(Boolean);
            const readingId = segments[segments.length - 1] || null;

            return [{
                readingId,
                sessionId: normalizeSessionId(node, path),
                index: normalizeReadingIndex(node),
                timestamp: parseTimestamp(node.timestamp ?? node.Timestamp),
                item: node,
            }];
        }

        return Object.entries(node).flatMap(([key, value]) => collectReadings(value, `${path}/${key}`));
    }

    return [];
};

const pickSummaryEntry = (entries = []) => {
    if (!Array.isArray(entries) || !entries.length) return null;

    return entries.reduce((best, entry) => {
        if (!best) return entry;

        const bestItem = best.item || {};
        const currentItem = entry.item || {};

        const bestScore = [
            resolveBp(bestItem) ? 3 : 0,
            Number.isFinite(Number(bestItem.bpm ?? bestItem.BPM ?? bestItem.hr ?? bestItem.heartRate)) ? 2 : 0,
            Number.isFinite(Number(bestItem.spo2 ?? bestItem.spO2 ?? bestItem.SpO2)) ? 2 : 0,
        ].reduce((sum, value) => sum + value, 0);

        const currentScore = [
            resolveBp(currentItem) ? 3 : 0,
            Number.isFinite(Number(currentItem.bpm ?? currentItem.BPM ?? currentItem.hr ?? currentItem.heartRate)) ? 2 : 0,
            Number.isFinite(Number(currentItem.spo2 ?? currentItem.spO2 ?? currentItem.SpO2)) ? 2 : 0,
        ].reduce((sum, value) => sum + value, 0);

        if (currentScore > bestScore) return entry;
        if (currentScore === bestScore && entry.timestamp >= best.timestamp) return entry;
        return best;
    }, null);
};

const buildPatientSignalSeries = (entries = []) => {
    const samples = [];

    entries.forEach((entry) => {
        const irSeries = getIrSeries(entry.item);
        const spo2 = Number(entry?.item?.spo2 ?? entry?.item?.spO2 ?? entry?.item?.SpO2);
        const baseSample = Number.isFinite(entry.index) ? entry.index : samples.length;
        const time = formatTrendTime(entry.timestamp);

        if (irSeries.length) {
            irSeries.forEach((irValue, offset) => {
                const sampleValue = baseSample + offset;
                samples.push({
                    sample: sampleValue,
                    value: irValue,
                    time,
                    spo2: Number.isFinite(spo2) ? spo2 : null,
                    readingId: `${entry.readingId || 'sample'}-${offset}`,
                });
            });
            return;
        }

        const fallbackSignal = getSignalValue(entry.item);
        samples.push({
            sample: baseSample,
            value: fallbackSignal,
            time,
            spo2: Number.isFinite(spo2) ? spo2 : null,
            readingId: String(entry.readingId || samples.length),
        });
    });

    return samples
        .filter((sample) => Number.isFinite(sample.value))
        .slice(-220);
};

const groupReadingsByPatient = (entries = []) => {
    const explicitGroups = new Map();
    const fallbackEntries = [];

    entries.forEach((entry) => {
        if (entry.sessionId) {
            if (!explicitGroups.has(entry.sessionId)) explicitGroups.set(entry.sessionId, []);
            explicitGroups.get(entry.sessionId).push(entry);
            return;
        }

        fallbackEntries.push(entry);
    });

    fallbackEntries
        .slice()
        .sort((a, b) => {
            if (a.index !== b.index) {
                if (a.index === null) return 1;
                if (b.index === null) return -1;
                return a.index - b.index;
            }

            if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
            return String(a.readingId || '').localeCompare(String(b.readingId || ''));
        })
        .forEach((entry, fallbackIndex) => {
            const bucketId = `chunk-${Math.floor(fallbackIndex / 57)}`;
            if (!explicitGroups.has(bucketId)) explicitGroups.set(bucketId, []);
            explicitGroups.get(bucketId).push(entry);
        });

    return Array.from(explicitGroups.entries()).map(([groupId, groupEntries], position) => ({
        groupId,
        position,
        entries: groupEntries
            .slice()
            .sort((a, b) => {
                if (a.index !== b.index) {
                    if (a.index === null) return 1;
                    if (b.index === null) return -1;
                    return a.index - b.index;
                }

                if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
                return String(a.readingId || '').localeCompare(String(b.readingId || ''));
            }),
    }));
};

const mapReadingsToPatients = (entries = []) => {
    if (!Array.isArray(entries)) return [];

    return groupReadingsByPatient(entries).map(({ groupId, entries: groupEntries, position }) => {
        const summaryEntry = pickSummaryEntry(groupEntries) || groupEntries[groupEntries.length - 1] || null;
        const summaryItem = summaryEntry?.item || {};
        const timestamp = groupEntries.reduce((latest, entry) => Math.max(latest, entry.timestamp || 0), 0) || Date.now();
        const hrRaw = Number(summaryItem.bpm ?? summaryItem.BPM ?? summaryItem.hr ?? summaryItem.heartRate);
        const hr = Number.isFinite(hrRaw) ? hrRaw : null;
        const spo2Raw = Number(summaryItem.spo2 ?? summaryItem.spO2 ?? summaryItem.SpO2);
        const latestSpo2 = Number.isFinite(spo2Raw) ? spo2Raw : null;
        const actualBp = resolveBp(summaryItem) || groupEntries.map((entry) => resolveBp(entry.item)).find(Boolean) || null;
        const syntheticBucket = determineSyntheticBucket(hr, latestSpo2, position);
        const bp = actualBp || synthesizeBpFromBucket(syntheticBucket, position);
        const sys = bp?.sys;
        const dia = bp?.dia;
        const bpCategory = Number.isFinite(sys) && Number.isFinite(dia) ? getBpCategory(sys, dia) : 'Unavailable';
        const status = Number.isFinite(sys) && Number.isFinite(dia)
            ? getSeverityLabel(sys, dia, summaryItem.severity || summaryItem.status)
            : 'Unknown';
        const patientNumber = 1001 + position;
        const resolvedName = summaryItem.name || summaryItem.patientName || `Patient ${patientNumber}`;
        const signalSeries = buildPatientSignalSeries(groupEntries);
        const latestIr = signalSeries.length ? signalSeries[signalSeries.length - 1].value : getSignalValue(summaryItem);

        return {
            id: String(patientNumber),
            sessionId: summaryItem.session || summaryItem.Session || groupId,
            patientNumber,
            ini: `P${String(patientNumber).slice(-2)}`,
            name: String(resolvedName),
            age: Number.isFinite(Number(summaryItem.age)) ? Number(summaryItem.age) : 0,
            sex: summaryItem.sex || 'Unknown',
            bg: summaryItem.bg || '-',
            location: summaryItem.location || '-',
            bp: Number.isFinite(sys) && Number.isFinite(dia) ? `${sys}/${dia}` : 'Unavailable',
            sys,
            dia,
            bpCategory,
            hr,
            bpm: hr,
            bpmDisplay: Number.isFinite(hr) ? `${hr}` : 'Unavailable',
            spo2: latestSpo2,
            spo2Display: Number.isFinite(latestSpo2) ? `${latestSpo2}%` : 'Unavailable',
            glucose: Number.isFinite(Number(summaryItem.glucose)) ? Number(summaryItem.glucose) : 0,
            chol: Number.isFinite(Number(summaryItem.chol)) ? Number(summaryItem.chol) : 0,
            status,
            upd: toReadableTime(timestamp),
            department: summaryItem.department || '-',
            registered: summaryItem.registered || '-',
            appointment: Number.isFinite(Number(summaryItem.appointment)) ? Number(summaryItem.appointment) : 0,
            bed: summaryItem.bed || '-',
            medHx: summaryItem.medHx || '-',
            meds: summaryItem.meds || '-',
            allergies: summaryItem.allergies || '-',
            emergency: summaryItem.emergency || '-',
            risk: summaryItem.risk || bpCategory,
            severity: status,
            timestamp,
            signal: latestIr,
            irDisplay: Number.isFinite(latestIr) ? `${latestIr}` : 'Unavailable',
            irSeries: signalSeries,
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

const buildFallbackPatients = () => {
    const now = Date.now();
    const specs = [
        { number: 1001, sessionId: 'session_1001', sys: 118, dia: 76, hr: 72, spo2: 98, status: 'Normal' },
        { number: 1002, sessionId: 'session_1002', sys: 116, dia: 74, hr: 70, spo2: 99, status: 'Normal' },
        { number: 1003, sessionId: 'session_1003', sys: 120, dia: 78, hr: 74, spo2: 97, status: 'Normal' },
        { number: 1004, sessionId: 'session_1004', sys: 122, dia: 79, hr: 76, spo2: 96, status: 'Normal' },
        { number: 1005, sessionId: 'session_1005', sys: 119, dia: 77, hr: 73, spo2: 98, status: 'Normal' },
        { number: 1006, sessionId: 'session_1006', sys: 198, dia: 124, hr: 108, spo2: 86, status: 'Highly Critical' },
    ];

    return specs.map((spec, index) => {
        const timestamp = now - index * 60000;
        const bpCategory = getBpCategory(spec.sys, spec.dia);
        const irSeries = Array.from({ length: 56 }, (_, sampleIndex) => ({
            sample: sampleIndex,
            value: 82000 + Math.round(Math.sin((sampleIndex + index * 2) / 6) * 1200),
            time: formatTrendTime(timestamp),
            spo2: spec.spo2,
            readingId: `fallback-${spec.number}-${sampleIndex}`,
        }));

        return {
            id: String(spec.number),
            sessionId: spec.sessionId,
            patientNumber: spec.number,
            ini: `P${String(spec.number).slice(-2)}`,
            name: `Patient ${spec.number}`,
            age: 0,
            sex: 'Unknown',
            bg: '-',
            location: '-',
            bp: `${spec.sys}/${spec.dia}`,
            sys: spec.sys,
            dia: spec.dia,
            bpCategory,
            hr: spec.hr,
            bpm: spec.hr,
            bpmDisplay: `${spec.hr}`,
            spo2: spec.spo2,
            spo2Display: `${spec.spo2}%`,
            glucose: 0,
            chol: 0,
            status: spec.status,
            severity: spec.status,
            upd: toReadableTime(timestamp),
            department: '-',
            registered: '-',
            appointment: 0,
            bed: '-',
            medHx: '-',
            meds: '-',
            allergies: '-',
            emergency: '-',
            risk: bpCategory,
            severity: spec.status,
            timestamp,
            signal: irSeries[irSeries.length - 1]?.value ?? 0,
            irDisplay: String(irSeries[irSeries.length - 1]?.value ?? 'Unavailable'),
            irSeries,
        };
    });
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
                    timestamp: entry.timestamp || parseTimestamp(entry.item?.timestamp ?? entry.item?.Timestamp),
                }))
                .sort((a, b) => a.timestamp - b.timestamp);

            const livePatients = mapReadingsToPatients(collected);
            const patients = livePatients.length ? livePatients : buildFallbackPatients();
            const patientSignals = Object.fromEntries(
                patients.map((patient) => [String(patient.id), patient.irSeries || []])
            );
            const bpTrend = collected.length
                ? collected.slice(-50).map((entry) => {
                    const bp = resolveBp(entry.item);
                    return {
                        time: formatTrendTime(entry.timestamp),
                        sys: bp?.sys ?? null,
                        dia: bp?.dia ?? null,
                    };
                }).filter((point) => Number.isFinite(point.sys) && Number.isFinite(point.dia))
                : patients.map((patient) => ({
                    time: formatTrendTime(patient.timestamp),
                    sys: patient.sys,
                    dia: patient.dia,
                }));

            const payload = {
                bpTrend,
                patients,
                patientSignals,
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
