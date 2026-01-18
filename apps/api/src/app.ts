import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import cardsRouter from './routes/cards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'clarityflow-api' });
});

// API routes
app.use('/api/cards', cardsRouter);

// Serve static files and handle SPA routing in production
if (process.env.NODE_ENV === 'production') {
  // Path to the web app's dist folder (from api/dist/../../web/dist)
  const webDistPath = path.resolve(__dirname, '../../web/dist');

  // Serve static files
  app.use(express.static(webDistPath));

  // SPA fallback: redirect all non-API routes to index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// Error handling middleware (must be last)
app.use(errorHandler);


