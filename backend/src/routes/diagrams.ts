import express, { Request, Response } from 'express';
import multer from 'multer';
import { runAll, run, runQuery } from '../database';
import { Diagram } from '../database';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all diagrams in a collection
router.get('/collection/:collectionId', async (req: Request, res: Response) => {
  try {
    const diagrams = await runAll<Diagram>(
      'SELECT * FROM diagrams WHERE collection_id = ? ORDER BY created_at DESC',
      [req.params.collectionId]
    );
    res.json(diagrams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diagrams' });
  }
});

// Get single diagram
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const diagram = await runQuery<Diagram>(
      'SELECT * FROM diagrams WHERE id = ?',
      [req.params.id]
    );
    if (!diagram) {
      return res.status(404).json({ error: 'Diagram not found' });
    }
    res.json(diagram);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diagram' });
  }
});

// Create diagram
router.post('/', async (req: Request, res: Response) => {
  try {
    const { collection_id, name, content } = req.body;
    if (!collection_id || !name || !content) {
      return res.status(400).json({ error: 'collection_id, name, and content are required' });
    }
    const result = await run(
      'INSERT INTO diagrams (collection_id, name, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [collection_id, name, content]
    );
    const diagram = await runQuery<Diagram>(
      'SELECT * FROM diagrams WHERE id = ?',
      [result.lastID]
    );
    res.status(201).json(diagram);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create diagram' });
  }
});

// Update diagram
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, content } = req.body;
    await run(
      'UPDATE diagrams SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, content, req.params.id]
    );
    const diagram = await runQuery<Diagram>(
      'SELECT * FROM diagrams WHERE id = ?',
      [req.params.id]
    );
    if (!diagram) {
      return res.status(404).json({ error: 'Diagram not found' });
    }
    res.json(diagram);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update diagram' });
  }
});

// Delete diagram
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await run('DELETE FROM diagrams WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Diagram not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete diagram' });
  }
});

// Upload Mermaid file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { collection_id } = req.body;
    if (!collection_id) {
      return res.status(400).json({ error: 'collection_id is required' });
    }
    const content = req.file.buffer.toString('utf-8');
    const name = req.file.originalname.replace(/\.(mmd|mermaid)$/i, '');
    
    const result = await run(
      'INSERT INTO diagrams (collection_id, name, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [collection_id, name, content]
    );
    const diagram = await runQuery<Diagram>(
      'SELECT * FROM diagrams WHERE id = ?',
      [result.lastID]
    );
    res.status(201).json(diagram);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload diagram' });
  }
});

export default router;

