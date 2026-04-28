import { randomUUID } from 'crypto';

export const requestLogger = (req, res, next) => {
  req.traceId = randomUUID();
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const metadata = {
      traceId: req.traceId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    if (res.statusCode >= 400) {
      console.error(JSON.stringify({ level: 'error', ...metadata }));
    } else if (process.env.LOG_LEVEL === 'debug') {
      console.log(JSON.stringify({ level: 'debug', ...metadata }));
    } else {
      console.info(JSON.stringify({ level: 'info', ...metadata }));
    }
  });

  next();
};
