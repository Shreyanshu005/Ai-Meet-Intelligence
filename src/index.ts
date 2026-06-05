import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
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
import { connectRedis, redis } from './lib/redis';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(traceIdMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'UP', traceId: req.traceId });
});

app.get('/api/evaluation', (req, res) => {
  res.json({
    candidateName: "John Doe",
    email: "john@example.com",
    repositoryUrl: "https://github.com/Shreyanshu005/Ai-Meet-Intelligence",
    deployedUrl: "https://example.com",
    externalIntegration: "Resend Email API",
    features: [
      "Authentication",
      "AI Analysis",
      "Reminder Scheduler",
      "Rate Limiting",
      "Idempotent Caching",
      "Pagination"
    ]
  });
});

const swaggerDocument = yaml.load(path.join(__dirname, '../swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
  }),
});

app.use('/api', limiter);

app.use('/api/auth', authRouter);

app.use('/api/meetings', authMiddleware, meetingsRouter);
app.use('/api/meetings', authMiddleware, analysisRouter);
app.use('/api/action-items', authMiddleware, actionItemsRouter);

app.use(errorHandler);

export { app };

const start = async () => {
  try {
    await connectRedis();
    startScheduler();

    if (process.env.NODE_ENV !== 'test') {
      app.listen(env.PORT, () => {
        logger.info(`Server running on port ${env.PORT}`);
      });
    }
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

start();
