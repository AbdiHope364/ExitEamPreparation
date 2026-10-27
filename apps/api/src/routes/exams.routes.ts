import { Router, Request, Response } from 'express';
import { dbStore, MemoryExamAttempt } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { AttemptStatus } from '@exitprep/shared';

export const examsRouter = Router();

// GET /api/v1/exams
examsRouter.get('/', (req: Request, res: Response) => {
  const { programId } = req.query;
  let exams = dbStore.exams.filter((e) => e.isPublished);

  if (programId) {
    exams = exams.filter((e) => e.programId === programId);
  }

  res.json({
    success: true,
    data: exams,
  });
});

// POST /api/v1/exams/:id/start
examsRouter.post('/:id/start', authenticateToken, (req: Request, res: Response) => {
  const exam = dbStore.exams.find((e) => e.id === req.params.id && e.isPublished);
  if (!exam) {
    res.status(404).json({
      success: false,
      error: { code: 'EXAM_NOT_FOUND', message: 'Mock exam not found' },
    });
    return;
  }

  const userId = req.user!.userId;
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);

  const attempt: MemoryExamAttempt = {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    examId: exam.id,
    status: AttemptStatus.IN_PROGRESS,
    totalQuestions: exam.questionIds.length,
    timeSpentSeconds: 0,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    answers: [],
  };

  dbStore.attempts.push(attempt);

  // Return questions with answers stripped
  const questions = dbStore.questions
    .filter((q) => exam.questionIds.includes(q.id))
    .map((q) => ({
      id: q.id,
      stem: q.stem,
      difficulty: q.difficulty,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        orderIndex: opt.orderIndex,
      })),
    }));

  res.json({
    success: true,
    data: {
      attempt: {
        id: attempt.id,
        examId: attempt.examId,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        durationMinutes: exam.durationMinutes,
        totalQuestions: attempt.totalQuestions,
      },
      questions,
    },
  });
});

// POST /api/v1/exams/attempts/:attemptId/submit
examsRouter.post('/attempts/:attemptId/submit', authenticateToken, (req: Request, res: Response) => {
  const attempt = dbStore.attempts.find((a) => a.id === req.params.attemptId);
  if (!attempt) {
    res.status(404).json({
      success: false,
      error: { code: 'ATTEMPT_NOT_FOUND', message: 'Exam attempt not found' },
    });
    return;
  }

  if (attempt.userId !== req.user!.userId) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized for this attempt' },
    });
    return;
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    res.status(400).json({
      success: false,
      error: { code: 'ALREADY_SUBMITTED', message: 'Attempt has already been finalized' },
    });
    return;
  }

  const { answers } = req.body as { answers: { questionId: string; selectedOptionId: string }[] };
  const exam = dbStore.exams.find((e) => e.id === attempt.examId)!;

  let correctCount = 0;
  const processedAnswers = (answers || []).map((ans) => {
    const q = dbStore.questions.find((quest) => quest.id === ans.questionId);
    const correctOpt = q?.options.find((o) => o.isCorrect);
    const isCorrect = correctOpt?.id === ans.selectedOptionId;
    if (isCorrect) correctCount++;
    return {
      questionId: ans.questionId,
      selectedOptionId: ans.selectedOptionId,
      isCorrect,
    };
  });

  const totalQuestions = exam.questionIds.length || 1;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const now = new Date();
  const timeSpentSeconds = Math.max(0, Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000));

  attempt.status = AttemptStatus.SUBMITTED;
  attempt.submittedAt = now.toISOString();
  attempt.timeSpentSeconds = timeSpentSeconds;
  attempt.totalCorrect = correctCount;
  attempt.totalQuestions = totalQuestions;
  attempt.scorePercent = scorePercent;
  attempt.answers = processedAnswers;

  const passed = scorePercent >= exam.passingScorePercent;

  res.json({
    success: true,
    data: {
      attemptId: attempt.id,
      scorePercent,
      totalCorrect: correctCount,
      totalQuestions,
      passed,
      passingScorePercent: exam.passingScorePercent,
      timeSpentSeconds,
      submittedAt: attempt.submittedAt,
    },
  });
});
