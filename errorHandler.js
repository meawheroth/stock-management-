module.exports = (err, req, res, next) => {
  // err.status มาจาก body-parser (เช่น JSON พัง = 400) เดิมถูกนับเป็น 500
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') { status = 400; message = `Invalid ${err.path}`; }
  if (err.code === 11000) {
    status = 409;
    message = `Duplicate value: ${Object.keys(err.keyValue || {}).join(', ')}`;
  }
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (status >= 500) { console.error(err); message = 'Server error'; }
  res.status(status).json({ message });
};
