import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import webhookRouter from './routes/webhook.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the api directory
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Routes
app.use('/api', webhookRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('Azure DevOps Webhook API Server');
  console.log('='.repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Webhook Secret: ${process.env.WEBHOOK_SECRET ? 'Configured' : 'Not Configured'}`);
  console.log(`ADO PAT: ${process.env.ADO_PAT ? 'Configured (will fetch old iteration paths)' : 'Not Configured (old paths from webhook only)'}`);
  console.log(`Endpoint: http://localhost:${PORT}/api/revertSprintChange`);
  console.log('='.repeat(60));
});
