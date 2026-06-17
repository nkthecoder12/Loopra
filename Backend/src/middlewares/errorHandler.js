const errorHandler = (err, req, res, next) => {
  if (err.message && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({ success: false, message: err.message });
  }
  if (err.message && err.message.startsWith("Socket CORS blocked")) {
    return res.status(403).json({ success: false, message: err.message });
  }

  let error = { ...err };
  error.message = err.message;

  console.error('ERROR:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: 400,
      message: 'Validation Error',
      details: message
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = {
      statusCode: 400,
      message: 'Duplicate Field Error',
      details: `${field} '${value}' already exists`
    };
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    error = {
      statusCode: 400,
      message: 'Invalid ID Format',
      details: 'Resource not found'
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Invalid Token',
      details: 'Please log in again'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token Expired',
      details: 'Please log in again'
    };
  }

  // Transaction errors
  if (err.name === 'MongoServerError' && err.errorLabels?.includes('TransientTransactionError')) {
    error = {
      statusCode: 503,
      message: 'Transaction Failed',
      details: 'Please try again'
    };
  }

  // Default error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const details = error.details || null;

  // Don't expose stack trace in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    success: false,
    message,
    ...(details && { details }),
    ...(isDevelopment && { stack: err.stack })
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;