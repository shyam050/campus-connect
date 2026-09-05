import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';
import { startCron, stopCron } from './cron/reminders';
import { User } from './models/User';

async function main() {
  await connectDB();
  startCron();

  const server = app.listen(env.port, () => {
    console.log(`✓ CampusConnect API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    if (env.isProd) {
      console.log('  Secrets verified, refresh cookies are secure');
    }
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down...`);
    stopCron();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

// Warn early if the admin bootstrap is missing (seed script creates it)
main().catch(async (err) => {
  console.error('Failed to start:', err);
  try {
    const admins = await User.countDocuments({ role: 'admin' });
    if (admins === 0) {
      console.error('Hint: no admin users found. Run `npm run seed` to create demo accounts.');
    }
  } catch {
    /* DB unreachable — already reported */
  }
  process.exit(1);
});
