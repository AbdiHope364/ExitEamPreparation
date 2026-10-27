import { Router, Request, Response } from 'express';
import { dbStore } from '../db.js';

export const practiceRouter = Router();

// GET /api/v1/practice/questions
practiceRouter.get('/questions', (req: Request, res: Response) => {
  const { programId, topicId, limit = '10' } = req.query;

  let questions = dbStore.questions.filter((q) => q.isPublished);

  if (programId) {
    questions = questions.filter((q) => q.programId === programId);
  }

  if (topicId) {
    questions = questions.filter((q) => q.topicId === topicId);
  }

  const parsedLimit = Math.min(parseInt(limit as string, 10) || 10, 50);
  const sliced = questions.slice(0, parsedLimit);

  // Strip correct answer flags to prevent client-side inspection tampering
  const safeQuestions = sliced.map((q) => ({
    id: q.id,
    topicId: q.topicId,
    programId: q.programId,
    stem: q.stem,
    difficulty: q.difficulty,
    referenceSource: q.referenceSource,
    options: q.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      orderIndex: opt.orderIndex,
    })),
  }));

  res.json({
    success: true,
    data: safeQuestions,
  });
});

// POST /api/v1/practice/check-answer
practiceRouter.post('/check-answer', (req: Request, res: Response) => {
  const { questionId, selectedOptionId } = req.body;

  if (!questionId || !selectedOptionId) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'questionId and selectedOptionId are required' },
    });
    return;
  }

  const question = dbStore.questions.find((q) => q.id === questionId);
  if (!question) {
    res.status(404).json({
      success: false,
      error: { code: 'QUESTION_NOT_FOUND', message: 'Question not found' },
    });
    return;
  }

  const correctOption = question.options.find((o) => o.isCorrect);
  const selectedOption = question.options.find((o) => o.id === selectedOptionId);
  const isCorrect = correctOption?.id === selectedOptionId;

  res.json({
    success: true,
    data: {
      questionId,
      selectedOptionId,
      isCorrect,
      correctOptionId: correctOption?.id,
      explanation: question.explanation,
      optionExplanation: selectedOption?.explanation,
      referenceSource: question.referenceSource,
    },
  });
});
