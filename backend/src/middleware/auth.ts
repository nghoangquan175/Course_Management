import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Please login to continue' });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session timed out, please login again' });
  }
};

export const optionalProtect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as UserPayload;
      req.user = decoded;
    }
    next();
  } catch (error) {
    // Just proceed without user
    next();
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
};
