import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dbStore, MemoryPaymentReceipt } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { PaymentMethod, PaymentStatus, SubscriptionStatus } from '@exitprep/shared';

export const subscriptionsRouter = Router();

const PaymentSubmissionSchema = z.object({
  planId: z.string(),
  bankName: z.nativeEnum(PaymentMethod),
  transactionRef: z.string().min(5),
  amountETB: z.number().positive(),
  notes: z.string().optional(),
});

// GET /api/v1/subscriptions/plans
subscriptionsRouter.get('/plans', (req: Request, res: Response) => {
  const plans = dbStore.plans.filter((p) => p.isActive);
  res.json({
    success: true,
    data: plans,
  });
});

// GET /api/v1/subscriptions/my
subscriptionsRouter.get('/my', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const subscriptions = dbStore.subscriptions.filter((s) => s.userId === userId);
  const receipts = dbStore.receipts.filter((r) => r.userId === userId);

  const activeSub = subscriptions.find((s) => s.status === SubscriptionStatus.ACTIVE);
  const plan = activeSub ? dbStore.plans.find((p) => p.id === activeSub.planId) : null;

  res.json({
    success: true,
    data: {
      activeSubscription: activeSub
        ? {
            ...activeSub,
            planName: plan?.name,
            tier: plan?.tier,
          }
        : null,
      history: subscriptions,
      paymentReceipts: receipts,
    },
  });
});

// POST /api/v1/subscriptions/payments/submit
subscriptionsRouter.post('/payments/submit', authenticateToken, (req: Request, res: Response) => {
  const parseResult = PaymentSubmissionSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid payment submission details', details: parseResult.error.format() },
    });
    return;
  }

  const { planId, bankName, transactionRef, amountETB, notes } = parseResult.data;
  const plan = dbStore.plans.find((p) => p.id === planId);
  if (!plan) {
    res.status(404).json({
      success: false,
      error: { code: 'PLAN_NOT_FOUND', message: 'Subscription plan not found' },
    });
    return;
  }

  // Check duplicate transaction reference
  const duplicate = dbStore.receipts.find(
    (r) => r.transactionRef.trim().toUpperCase() === transactionRef.trim().toUpperCase()
  );
  if (duplicate) {
    res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_TRANSACTION', message: 'This transaction reference has already been submitted.' },
    });
    return;
  }

  const userId = req.user!.userId;

  // Create pending subscription record
  const subId = `sub-${Date.now()}`;
  dbStore.subscriptions.push({
    id: subId,
    userId,
    planId: plan.id,
    status: SubscriptionStatus.PENDING_VERIFICATION,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + plan.durationDays * 24 * 3600 * 1000).toISOString(),
  });

  const receipt: MemoryPaymentReceipt = {
    id: `rcpt-${Date.now()}`,
    userId,
    subscriptionId: subId,
    bankName,
    transactionRef: transactionRef.trim().toUpperCase(),
    amountETB,
    notes,
    status: PaymentStatus.SUBMITTED,
    createdAt: new Date().toISOString(),
  };

  dbStore.receipts.push(receipt);

  res.status(201).json({
    success: true,
    data: {
      message: 'Payment receipt submitted successfully. Our verification team will review your CBE / Telebirr transaction.',
      receipt,
    },
  });
});
