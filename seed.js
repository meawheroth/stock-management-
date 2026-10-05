require('dns').setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./User');

(async () => {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ ตั้งค่า MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD ใน .env ก่อน');
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGODB_URI);
    const email = ADMIN_EMAIL.toLowerCase();
    const exists = await User.findOne({ email });
    if (!exists) {
      await User.create({
        fullName: 'System Admin', userCode: 'ADMIN001', department: 'IT',
        email, password: ADMIN_PASSWORD, role: 'admin'
      });
      console.log(`✅ Admin created: ${email} (เปลี่ยนรหัสผ่านทันที)`);
    } else console.log('Admin already exists');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
