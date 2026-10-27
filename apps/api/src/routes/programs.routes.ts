import { Router, Request, Response } from 'express';
import { dbStore } from '../db.js';

export const programsRouter = Router();

// GET /api/v1/programs
programsRouter.get('/', (req: Request, res: Response) => {
  const { categoryId, categoryCode } = req.query;

  let filtered = dbStore.programs.filter((p) => p.isActive);

  if (categoryId) {
    filtered = filtered.filter((p) => p.categoryId === categoryId);
  } else if (categoryCode) {
    const category = dbStore.categories.find((c) => c.code === categoryCode);
    if (category) {
      filtered = filtered.filter((p) => p.categoryId === category.id);
    }
  }

  const result = filtered.map((prog) => {
    const questionCount = dbStore.questions.filter((q) => q.programId === prog.id && q.isPublished).length;
    return {
      ...prog,
      questionCount,
    };
  });

  res.json({
    success: true,
    data: result,
  });
});

// GET /api/v1/programs/:id
programsRouter.get('/:id', (req: Request, res: Response) => {
  const prog = dbStore.programs.find((p) => p.id === req.params.id);
  if (!prog) {
    res.status(404).json({
      success: false,
      error: { code: 'PROGRAM_NOT_FOUND', message: 'Program not found in catalog' },
    });
    return;
  }

  const questionCount = dbStore.questions.filter((q) => q.programId === prog.id && q.isPublished).length;
  const exams = dbStore.exams.filter((e) => e.programId === prog.id && e.isPublished);

  res.json({
    success: true,
    data: {
      ...prog,
      questionCount,
      exams,
    },
  });
});
