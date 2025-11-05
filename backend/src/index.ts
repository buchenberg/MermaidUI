import express from 'express';
import cors from 'cors';
import { initDatabase } from './database';
import collectionsRouter from './routes/collections';
import diagramsRouter from './routes/diagrams';
import exportRouter from './routes/export';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/collections', collectionsRouter);
app.use('/api/diagrams', diagramsRouter);
app.use('/api/export', exportRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

