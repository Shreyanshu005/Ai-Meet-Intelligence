import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './lib/logger';
import { traceIdMiddleware } from './middleware/traceId';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.router';
import { meetingsRouter } from './modules/meetings/meetings.router';
import { analysisRouter } from './modules/analysis/analysis.router';
import { actionItemsRouter } from './modules/actionItems/actionItems.router';
import { authMiddleware } from './middleware/auth';
import { startScheduler } from './jobs/scheduler';
import { connectRedis } from './lib/redis';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(traceIdMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', traceId: req.traceId });
});

// Swagger setup (placeholder - you can expand this with zod-to-openapi later)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup({
  openapi: '3.0.0',
  info: { title: 'Meetings API', version: '1.0.0' },
  paths: {}
}));

app.use('/api/auth', authRouter);

app.use('/api/meetings', authMiddleware, meetingsRouter);
app.use('/api/meetings', authMiddleware, analysisRouter);
app.use('/api/action-items', authMiddleware, actionItemsRouter);

app.use(errorHandler);

const start = async () => {
  try {
    await connectRedis();
    startScheduler();

    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

start();
