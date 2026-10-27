import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      cookies?: Record<string, string>;
    }
  }
}

/**
 * Lightweight cookie parsing middleware without external native dependencies
 */
export function cookieParser(req: Request, _res: Response, next: NextFunction): void {
  const cookieHeader = req.headers.cookie;
  const cookies: Record<string, string> = {};

  if (cookieHeader) {
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const idx = pair.indexOf('=');
      if (idx !== -1) {
        const key = pair.substring(0, idx).trim();
        const rawVal = pair.substring(idx + 1).trim();
        try {
          cookies[key] = decodeURIComponent(rawVal);
        } catch {
          cookies[key] = rawVal;
        }
      }
    }
  }

  req.cookies = cookies;
  next();
}

