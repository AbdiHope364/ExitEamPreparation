import { Router, Request, Response } from 'express';
import { dbStore } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { UserRole, PaymentStatus, SubscriptionStatus, QuestionStatus } from '@exitprep/shared';

export const adminRouter = Router();

// Require any admin/staff role
adminRouter.use(
  authenticateToken,
  requireRole([
    UserRole.SUPER_ADMINISTRATOR,
    UserRole.PAYMENT_ADMINISTRATOR,
    UserRole.REVIEWER,
    UserRole.CONTENT_EDITOR,
  ])
);

// GET /api/v1/admin/dashboard
adminRouter.get('/dashboard', (req: Request, res: Response) => {
  const totalStudents = dbStore.users.filter((u) => u.role === UserRole.STUDENT).length;
  const pendingPayments = dbStore.receipts.filter((r) => r.status === PaymentStatus.SUBMITTED).length;
  const pendingQuestions = dbStore.questions.filter((q) => q.status === QuestionStatus.PENDING_REVIEW).length;
  const verifiedQuestions = dbStore.questions.filter((q) => q.status === QuestionStatus.VERIFIED).length;
  const activeSubscriptions = dbStore.subscriptions.filter((s) => s.status === SubscriptionStatus.ACTIVE).length;

  res.json({
    success: true,
    data: {
      stats: {
        totalStudents,
        pendingPayments,
        pendingQuestions,
        verifiedQuestions,
        activeSubscriptions,
      },
    },
  });
});

// GET /api/v1/admin/payments/pending
adminRouter.get(
  '/payments/pending',
  requireRole([UserRole.SUPER_ADMINISTRATOR, UserRole.PAYMENT_ADMINISTRATOR]),
  (req: Request, res: Response) => {
    const list = dbStore.receipts.map((r) => {
      const user = dbStore.users.find((u) => u.id === r.userId);
      return {
        ...r,
        userName: user?.fullName,
        userEmail: user?.email,
      };
    });

    res.json({
      success: true,
      data: list,
    });
  }
);

// POST /api/v1/admin/payments/:id/verify
adminRouter.post(
  '/payments/:id/verify',
  requireRole([UserRole.SUPER_ADMINISTRATOR, UserRole.PAYMENT_ADMINISTRATOR]),
  (req: Request, res: Response) => {
    const receipt = dbStore.receipts.find((r) => r.id === req.params.id);
    if (!receipt) {
      res.status(404).json({
        success: false,
        error: { code: 'RECEIPT_NOT_FOUND', message: 'Payment receipt not found' },
      });
      return;
    }

    const { action, adminNotes } = req.body as { action: 'APPROVE' | 'REJECT'; adminNotes?: string };

    if (action === 'APPROVE') {
      receipt.status = PaymentStatus.VERIFIED;
      receipt.verifiedById = req.user!.userId;
      receipt.verifiedAt = new Date().toISOString();
      receipt.adminNotes = adminNotes || 'Verified manually against CBE/Telebirr bank statement';

      // Idempotently activate linked subscription
      if (receipt.subscriptionId) {
        const sub = dbStore.subscriptions.find((s) => s.id === receipt.subscriptionId);
        if (sub) {
          sub.status = SubscriptionStatus.ACTIVE;
          sub.startedAt = new Date().toISOString();
        }
      }

      // Log audit
      dbStore.auditLogs.push({
        id: `audit-${Date.now()}`,
        action: 'PAYMENT_VERIFIED',
        entity: 'PaymentReceipt',
        entityId: receipt.id,
        performedById: req.user!.userId,
        details: { transactionRef: receipt.transactionRef, amountETB: receipt.amountETB },
        createdAt: new Date().toISOString(),
      });
    } else {
      receipt.status = PaymentStatus.REJECTED;
      receipt.verifiedById = req.user!.userId;
      receipt.verifiedAt = new Date().toISOString();
      receipt.adminNotes = adminNotes || 'Transaction reference not found on bank statement';

      if (receipt.subscriptionId) {
        const sub = dbStore.subscriptions.find((s) => s.id === receipt.subscriptionId);
        if (sub) {
          sub.status = SubscriptionStatus.CANCELLED;
        }
      }
    }

    res.json({
      success: true,
      data: receipt,
    });
  }
);

// GET /api/v1/admin/questions
adminRouter.get('/questions', (req: Request, res: Response) => {
  const { status, programId } = req.query;
  let questions = dbStore.questions;

  if (status) {
    questions = questions.filter((q) => q.status === status);
  }
  if (programId) {
    questions = questions.filter((q) => q.programId === programId);
  }

  const enriched = questions.map((q) => {
    const prog = dbStore.programs.find((p) => p.id === q.programId);
    const author = dbStore.users.find((u) => u.id === q.authorId);
    const reviewer = dbStore.users.find((u) => u.id === q.reviewerId);
    return {
      ...q,
      programName: prog?.name,
      authorName: author?.fullName,
      reviewerName: reviewer?.fullName,
    };
  });

  res.json({
    success: true,
    data: enriched,
  });
});

// POST /api/v1/admin/questions/:id/review
adminRouter.post(
  '/questions/:id/review',
  requireRole([UserRole.SUPER_ADMINISTRATOR, UserRole.REVIEWER]),
  (req: Request, res: Response) => {
    const question = dbStore.questions.find((q) => q.id === req.params.id);
    if (!question) {
      res.status(404).json({
        success: false,
        error: { code: 'QUESTION_NOT_FOUND', message: 'Question not found' },
      });
      return;
    }

    const { action, rejectionReason } = req.body as { action: 'APPROVE' | 'REJECT'; rejectionReason?: string };

    if (action === 'APPROVE') {
      question.status = QuestionStatus.VERIFIED;
      question.isPublished = true;
      question.reviewerId = req.user!.userId;
      question.rejectionReason = undefined;
    } else {
      question.status = QuestionStatus.REJECTED;
      question.isPublished = false;
      question.reviewerId = req.user!.userId;
      question.rejectionReason = rejectionReason || 'Content does not meet verification guidelines';
    }

    res.json({
      success: true,
      data: question,
    });
  }
);

// GET /api/v1/admin/users
adminRouter.get('/users', requireRole([UserRole.SUPER_ADMINISTRATOR]), (req: Request, res: Response) => {
  const safeUsers = dbStore.users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
  }));

  res.json({
    success: true,
    data: safeUsers,
  });
});

// PATCH /api/v1/admin/users/:id/role
adminRouter.patch('/users/:id/role', requireRole([UserRole.SUPER_ADMINISTRATOR]), (req: Request, res: Response) => {
  const user = dbStore.users.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  const { role } = req.body;
  if (!Object.values(UserRole).includes(role)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ROLE', message: 'Invalid role specified' },
    });
    return;
  }

  user.role = role;
  user.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

// GET /api/v1/admin/audit-logs
adminRouter.get('/audit-logs', requireRole([UserRole.SUPER_ADMINISTRATOR]), (req: Request, res: Response) => {
  res.json({
    success: true,
    data: dbStore.auditLogs,
  });
});
