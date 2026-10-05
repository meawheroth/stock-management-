const mongoose = require('mongoose');

mongoose.connection.on('error', (e) => console.error('MongoDB runtime error:', e));
mongoose.connection.on('disconnected', () => console.warn('⚠️ MongoDB disconnected'));

module.exports = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
};
