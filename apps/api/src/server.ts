import { app } from './app.js';
import { config } from './config.js';

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`  ExitPrep Ethiopia API is running!`);
  console.log(`  Listening on port: ${config.port}`);
  console.log(`  Health Check: http://localhost:${config.port}/health`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`====================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
