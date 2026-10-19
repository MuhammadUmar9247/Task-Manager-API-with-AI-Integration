const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
  }

  // Invalid JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
    });
  }

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = { notFound, errorHandler };
