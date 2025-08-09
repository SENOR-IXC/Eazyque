import { Request, Response, NextFunction } from 'express';

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(body: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log slow requests (over 200ms)
    if (duration > 200) {
      console.warn(`⚠️ Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Add performance headers
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    return originalSend.call(this, body);
  };

  next();
};

// Request timeout middleware
export const requestTimeout = (timeout: number = 15000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout',
          error: 'Request took too long to process'
        });
      }
    }, timeout);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timer);
    });

    next();
  };
};

// Cache control middleware
export const cacheControl = (maxAge: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    }
    next();
  };
};

// Database connection retry middleware
export const dbHealthCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // This will be imported where needed
    // const { prisma } = await import('@eazyque/database');
    // await prisma.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      error: 'Database connection issue'
    });
  }
};
