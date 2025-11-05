import express, { Request, Response } from 'express';
import { runAll, run, runQuery } from '../database';
import { Collection } from '../database';

const router = express.Router();

// Get all collections
router.get('/', async (req: Request, res: Response) => {
  try {
    const collections = await runAll<Collection>('SELECT * FROM collections ORDER BY created_at DESC');
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Get single collection
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const collection = await runQuery<Collection>(
      'SELECT * FROM collections WHERE id = ?',
      [req.params.id]
    );
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// Create collection
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await run(
      'INSERT INTO collections (name, description, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [name, description || null]
    );
    const collection = await runQuery<Collection>(
      'SELECT * FROM collections WHERE id = ?',
      [result.lastID]
    );
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Update collection
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    await run(
      'UPDATE collections SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description || null, req.params.id]
    );
    const collection = await runQuery<Collection>(
      'SELECT * FROM collections WHERE id = ?',
      [req.params.id]
    );
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Delete collection
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await run('DELETE FROM collections WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

export default router;

