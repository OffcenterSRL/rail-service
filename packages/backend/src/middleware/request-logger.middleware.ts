import { NextFunction, Request, Response } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    const source = req.ip || req.socket.remoteAddress || 'unknown';
    const queryPayload =
      req.query && Object.keys(req.query).length ? ` query=${JSON.stringify(req.query)}` : '';
    const bodyPayload =
      req.body && Object.keys(req.body).length ? ` body=${JSON.stringify(req.body)}` : '';
    console.log(
      `[rail-service] ${timestamp} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms (from ${source})${queryPayload}${bodyPayload}`,
    );
  });

  next();
};
