import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

function secret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (isProd) {
    throw new Error(`${name} must be set in production`);
  }
  return devFallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd,
  isTest: process.env.NODE_ENV === 'test',
  port: +(process.env.PORT ?? 5000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/campusconnect',
  accessSecret: secret('ACCESS_SECRET', 'dev-access-secret-change-me'),
  refreshSecret: secret('REFRESH_SECRET', 'dev-refresh-secret-change-me'),
  redisUrl: process.env.REDIS_URL,
  disableCron: process.env.DISABLE_CRON === 'true',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: +(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM ?? 'CampusConnect <no-reply@campusconnect.dev>',
  },
};

export const cloudinaryConfigured = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);

export const smtpConfigured = Boolean(env.smtp.host);
