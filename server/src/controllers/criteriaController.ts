import { Response } from 'express';
import getDb from '../database/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { Criterion } from '../types/index.js';

export async function getCriteria(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const db = getDb();

  try {
    const criteria = db
      .prepare('SELECT * FROM criteria WHERE user_id = ? ORDER BY display_order ASC')
      .all(req.user.userId) as Criterion[];

    res.json({ criteria });
  } catch (error) {
    console.error('Get criteria error:', error);
    res.status(500).json({ error: 'Failed to get criteria' });
  }
}

export async function createCriterion(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { name, description, tier } = req.body;

  if (!name || !tier) {
    res.status(400).json({ error: 'Name and tier are required' });
    return;
  }

  if (!['dealbreaker', 'important', 'nice-to-have'].includes(tier)) {
    res.status(400).json({ error: 'Invalid tier' });
    return;
  }

  const db = getDb();

  try {
    // Get max display_order
    const maxOrder = db
      .prepare('SELECT MAX(display_order) as max FROM criteria WHERE user_id = ?')
      .get(req.user.userId) as { max: number | null };

    const displayOrder = (maxOrder.max || 0) + 1;

    const result = db
      .prepare(
        'INSERT INTO criteria (user_id, name, description, tier, display_order) VALUES (?, ?, ?, ?, ?)'
      )
      .run(req.user.userId, name, description || null, tier, displayOrder);

    const criterion = db
      .prepare('SELECT * FROM criteria WHERE id = ?')
      .get(result.lastInsertRowid) as Criterion;

    res.status(201).json({ criterion });
  } catch (error) {
    console.error('Create criterion error:', error);
    res.status(500).json({ error: 'Failed to create criterion' });
  }
}

export async function updateCriterion(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const { name, description, tier, display_order } = req.body;

  const db = getDb();

  try {
    // Verify ownership
    const criterion = db
      .prepare('SELECT * FROM criteria WHERE id = ? AND user_id = ?')
      .get(id, req.user.userId) as Criterion | undefined;

    if (!criterion) {
      res.status(404).json({ error: 'Criterion not found' });
      return;
    }

    // Update criterion
    db.prepare(
      'UPDATE criteria SET name = ?, description = ?, tier = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(
      name || criterion.name,
      description !== undefined ? description : criterion.description,
      tier || criterion.tier,
      display_order !== undefined ? display_order : criterion.display_order,
      id
    );

    const updated = db
      .prepare('SELECT * FROM criteria WHERE id = ?')
      .get(id) as Criterion;

    res.json({ criterion: updated });
  } catch (error) {
    console.error('Update criterion error:', error);
    res.status(500).json({ error: 'Failed to update criterion' });
  }
}

export async function deleteCriterion(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const db = getDb();

  try {
    // Verify ownership
    const criterion = db
      .prepare('SELECT * FROM criteria WHERE id = ? AND user_id = ?')
      .get(id, req.user.userId);

    if (!criterion) {
      res.status(404).json({ error: 'Criterion not found' });
      return;
    }

    db.prepare('DELETE FROM criteria WHERE id = ?').run(id);

    res.json({ message: 'Criterion deleted successfully' });
  } catch (error) {
    console.error('Delete criterion error:', error);
    res.status(500).json({ error: 'Failed to delete criterion' });
  }
}

export async function bulkUpdateCriteria(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { criteria } = req.body;

  if (!Array.isArray(criteria)) {
    res.status(400).json({ error: 'Criteria must be an array' });
    return;
  }

  const db = getDb();

  try {
    // Start transaction
    const updateStmt = db.prepare(
      'UPDATE criteria SET name = ?, description = ?, tier = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    );

    const transaction = db.transaction((criteriaList: any[]) => {
      for (const criterion of criteriaList) {
        updateStmt.run(
          criterion.name,
          criterion.description || null,
          criterion.tier,
          criterion.display_order,
          criterion.id,
          req.user!.userId
        );
      }
    });

    transaction(criteria);

    // Get updated criteria
    const updated = db
      .prepare('SELECT * FROM criteria WHERE user_id = ? ORDER BY display_order ASC')
      .all(req.user.userId) as Criterion[];

    res.json({ criteria: updated });
  } catch (error) {
    console.error('Bulk update criteria error:', error);
    res.status(500).json({ error: 'Failed to update criteria' });
  }
}
