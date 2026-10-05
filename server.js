require('dns').setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ตรวจ env ที่จำเป็นก่อนเริ่ม (กัน JWT_SECRET ว่างจนออก token ไม่ได้ตอน runtime)
const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(` Missing env: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/loans', require('./routes/loans'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5173;
connectDB()
  .then(() => app.listen(PORT, () => console.log(` Server running on port ${PORT}`)))
  .catch((err) => {
    console.error('Cannot start server:', err.message);
    process.exit(1);
  });
