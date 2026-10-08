import "dotenv/config.js";

export const config = {
    port: process.env.PORT || 3000,
    databaseURL: process.env.DATABASE_URL,
    githubAppId: process.env.GITHUB_APP_ID,
    githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
    githubPrivateKeyPath: process.env.GITHUB_PRIVATE_KEY_PATH,
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL,
};