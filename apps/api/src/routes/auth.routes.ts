import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { dbStore, MemoryUser } from '../db.js';
import { config } from '../config.js';
import { authenticateToken, AuthUserPayload } from '../middleware/auth.js';
import { UserRole } from '@exitprep/shared';

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(6),
  phone: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Helper to sign JWT
function generateTokens(user: MemoryUser) {
  const payload: AuthUserPayload = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: '7d',
  });

  const refreshToken = jwt.sign({ userId: user.id }, config.jwtSecret, {
    expiresIn: '30d',
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: '7d',
  };
}

// POST /register
authRouter.post('/register', async (req: Request, res: Response) => {
  const parseResult = RegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid registration input', details: parseResult.error.format() },
    });
    return;
  }

  const { email, fullName, password, phone } = parseResult.data;

  // Check existing user
  const existing = dbStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(409).json({
      success: false,
      error: { code: 'USER_EXISTS', message: 'An account with this email address already exists.' },
    });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser: MemoryUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: email.toLowerCase(),
    fullName,
    phone,
    passwordHash,
    role: UserRole.STUDENT,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.users.push(newUser);

  // Auto-assign Free plan
  dbStore.subscriptions.push({
    id: `sub-${Date.now()}`,
    userId: newUser.id,
    planId: 'plan-free-01',
    status: (await import('@exitprep/shared')).SubscriptionStatus.ACTIVE,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
  });

  const tokens = generateTokens(newUser);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        phone: newUser.phone,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
      tokens,
    },
  });
});

// POST /login
authRouter.post('/login', async (req: Request, res: Response) => {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
    });
    return;
  }

  const { email, password } = parseResult.data;
  const user = dbStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
    return;
  }

  const tokens = generateTokens(user);
  const activeSub = dbStore.subscriptions.find((s) => s.userId === user.id);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      tokens,
      activeSubscription: activeSub,
    },
  });
});

// GET /me
authRouter.get('/me', authenticateToken, (req: Request, res: Response) => {
  const user = dbStore.users.find((u) => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User profile not found' },
    });
    return;
  }

  const activeSub = dbStore.subscriptions.find((s) => s.userId === user.id);

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      activeSubscription: activeSub,
    },
  });
});

// POST /refresh
authRouter.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({
      success: false,
      error: { code: 'TOKEN_REQUIRED', message: 'Refresh token is required' },
    });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, config.jwtSecret) as { userId: string };
    const user = dbStore.users.find((u) => u.id === payload.userId);

    if (!user || !user.isActive) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Invalid user session' },
      });
      return;
    }

    const tokens = generateTokens(user);
    res.json({
      success: true,
      data: { tokens },
    });
  } catch (err) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Invalid or expired refresh token' },
    });
  }
});

// POST /logout
authRouter.post('/logout', authenticateToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});
