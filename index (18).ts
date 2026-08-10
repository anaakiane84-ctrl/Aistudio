// Single Vercel Function entry point for all /api/* routes.
// The rewrite in vercel.json forwards the original API request to this
// Express application while keeping GEMINI_API_KEY on the server.
import app from '../server';

export default app;
