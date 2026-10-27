import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { dbStore, MemoryUser, MemorySession } from '../db.js';
import { config } from '../config.js';
import { authenticateToken, AuthUserPayload } from '../middleware/auth.js';
import { UserRole, SubscriptionStatus } from '@exitprep/shared';

export const authRouter = Router();

const RegisterSchema = z
  .object({
    email: z.string().email('Invalid email address format').optional().or(z.literal('')),
    phone: z.string().min(9, 'Phone number must be at least 9 digits').max(15).optional().or(z.literal('')),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    program: z.string().optional(),
  })
  .refine((data) => (data.email && data.email.length > 0) || (data.phone && data.phone.length > 0), {
    message: 'Either email address or phone number is required to register.',
  });

const LoginSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => data.identifier || data.email || data.phone, {
    message: 'Please provide your email address or phone number to sign in.',
  });

// Cookie helper
function setSessionCookie(res: Response, token: string) {
  res.cookie('exitprep_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  });
}

// Generate JWT + Session
function createSessionAndTokens(user: MemoryUser, req: Request, res: Response) {
  const sessionToken = `ses_${crypto.randomBytes(32).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const newSession: MemorySession = {
    id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    token: sessionToken,
    userId: user.id,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip || req.socket.remoteAddress,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  dbStore.sessions.push(newSession);
  setSessionCookie(res, sessionToken);

  const payload: AuthUserPayload = {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    role: user.role,
    sessionId: newSession.id,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '30d' });

  return {
    sessionToken,
    accessToken,
    refreshToken,
    expiresIn: '7d',
  };
}

// POST /api/v1/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const parseResult = RegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid registration details', details: parseResult.error.format() },
    });
    return;
  }

  const { email, phone, fullName, password } = parseResult.data;
  const cleanEmail = email && email.trim().length > 0 ? email.trim().toLowerCase() : undefined;
  const cleanPhone = phone && phone.trim().length > 0 ? phone.trim().replace(/\s+/g, '') : undefined;

  // Check unique constraints
  if (cleanEmail) {
    const existingEmail = dbStore.users.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (existingEmail) {
      res.status(409).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'An account with this email address already exists.' },
      });
      return;
    }
  }

  if (cleanPhone) {
    const existingPhone = dbStore.users.find((u) => u.phone === cleanPhone);
    if (existingPhone) {
      res.status(409).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'An account with this phone number already exists.' },
      });
      return;
    }
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser: MemoryUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: cleanEmail,
    phone: cleanPhone,
    fullName,
    passwordHash,
    role: UserRole.STUDENT,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.users.push(newUser);

  // Auto-assign Free Practice Plan
  dbStore.subscriptions.push({
    id: `sub-${Date.now()}`,
    userId: newUser.id,
    planId: 'plan-free-01',
    status: SubscriptionStatus.ACTIVE,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
  });

  const tokens = createSessionAndTokens(newUser, req, res);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        fullName: newUser.fullName,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
      tokens,
    },
  });
});

// POST /api/v1/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Please provide email or phone and password.' },
    });
    return;
  }

  const { identifier, email, phone, password } = parseResult.data;
  const loginKey = (identifier || email || phone || '').trim().toLowerCase();

  // Find user by email or phone
  const user = dbStore.users.find((u) => {
    if (u.email && u.email.toLowerCase() === loginKey) return true;
    if (u.phone && u.phone === loginKey) return true;
    return false;
  });

  if (!user) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please verify your email/phone and password.' },
    });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by an administrator.' },
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please verify your email/phone and password.' },
    });
    return;
  }

  const tokens = createSessionAndTokens(user, req, res);
  const activeSub = dbStore.subscriptions.find((s) => s.userId === user.id && s.status === SubscriptionStatus.ACTIVE);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      tokens,
      activeSubscription: activeSub,
    },
  });
});

// GET /api/v1/auth/me
authRouter.get('/me', authenticateToken, (req: Request, res: Response) => {
  const user = dbStore.users.find((u) => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User profile not found.' },
    });
    return;
  }

  const activeSub = dbStore.subscriptions.find((s) => s.userId === user.id && s.status === SubscriptionStatus.ACTIVE);

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      activeSubscription: activeSub,
    },
  });
});

// POST /api/v1/auth/logout
authRouter.post('/logout', authenticateToken, (req: Request, res: Response) => {
  // Revoke session if session token present
  const cookieToken = req.cookies?.exitprep_session;
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
  const token = cookieToken || headerToken;

  if (token) {
    const session = dbStore.sessions.find((s) => s.token === token);
    if (session) {
      session.revokedAt = new Date().toISOString();
    }
  }

  // Clear HttpOnly cookie
  res.clearCookie('exitprep_session', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  res.json({
    success: true,
    data: { message: 'Logged out successfully. Session revoked.' },
  });
});
