require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const domainRoutes = require('./routes/domains');
const evaluationRoutes = require('./routes/evaluation');
const answerRoutes = require('./routes/answers');
const uploadRoutes = require('./routes/uploads');
const adminRoutes = require('./routes/admin');
const adminStructuresRoutes = require('./routes/adminStructures');
const notificationRoutes = require('./routes/notifications');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/structures', adminStructuresRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'QA Platform API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
