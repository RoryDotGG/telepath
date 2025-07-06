import dotenv from 'dotenv';

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  dubApiKey: process.env.DUB_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedUserIds: process.env.ALLOWED_USER_IDS || '',
} as const;

export function validateConfig(): void {
  const requiredEnvVars = ['BOT_TOKEN', 'DUB_API_KEY', 'GEMINI_API_KEY'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}