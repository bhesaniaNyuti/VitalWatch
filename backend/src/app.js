const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const bpRoutes = require('./routes/bpRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/bp', bpRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use(errorHandler);

module.exports = app;
