export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    if (process.env.LOG_LEVEL === 'debug' || logLevel === 'error') {
      console.log(`[${new Date().toISOString()}] ${logLevel.toUpperCase()} - ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  
  next();
};
