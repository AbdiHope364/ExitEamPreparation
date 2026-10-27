import { Router, Request, Response } from 'express';
import { dbStore } from '../db.js';

export const categoriesRouter = Router();

// GET /api/v1/categories
categoriesRouter.get('/', (req: Request, res: Response) => {
  const result = dbStore.categories.map((cat) => {
    const programCount = dbStore.programs.filter((p) => p.categoryId === cat.id && p.isActive).length;
    return {
      ...cat,
      programCount,
    };
  });

  res.json({
    success: true,
    data: result,
  });
});
