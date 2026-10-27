import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { categoriesRouter } from './routes/categories.routes.js';
import { programsRouter } from './routes/programs.routes.js';
import { practiceRouter } from './routes/practice.routes.js';
import { examsRouter } from './routes/exams.routes.js';
import { subscriptionsRouter } from './routes/subscriptions.routes.js';
import { adminRouter } from './routes/admin.routes.js';

export const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost dev and origins in config
      if (!origin || config.corsOrigin.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev permissive
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Public Health Check (Per MVP blueprint)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'exitprep-api',
    version: '1.0.0-mvp',
    database: 'active',
  });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/programs', programsRouter);
app.use('/api/v1/practice', practiceRouter);
app.use('/api/v1/exams', examsRouter);
app.use('/api/v1/subscriptions', subscriptionsRouter);
app.use('/api/v1/admin', adminRouter);

// Global Error Handler
app.use(errorHandler);
