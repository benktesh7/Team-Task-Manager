const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
      field: err.meta?.target,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ success: false, message: 'Related record not found' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
