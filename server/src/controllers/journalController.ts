import { Response } from 'express';
import getDb from '../database/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { JournalEntry } from '../types/index.js';

export async function getJournalEntries(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { partnerId } = req.params;
  const db = getDb();

  try {
    // Verify partner ownership
    const partner = db
      .prepare('SELECT * FROM partners WHERE id = ? AND user_id = ?')
      .get(partnerId, req.user.userId);

    if (!partner) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    const entries = db
      .prepare('SELECT * FROM journal_entries WHERE partner_id = ? ORDER BY created_at DESC')
      .all(partnerId) as JournalEntry[];

    res.json({ entries });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ error: 'Failed to get journal entries' });
  }
}

export async function createJournalEntry(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { partnerId } = req.params;
  const { content, mood } = req.body;

  if (!content) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }

  const db = getDb();

  try {
    // Verify partner ownership
    const partner = db
      .prepare('SELECT * FROM partners WHERE id = ? AND user_id = ?')
      .get(partnerId, req.user.userId);

    if (!partner) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    const result = db
      .prepare(
        'INSERT INTO journal_entries (partner_id, user_id, content, mood) VALUES (?, ?, ?, ?)'
      )
      .run(partnerId, req.user.userId, content, mood || null);

    const entry = db
      .prepare('SELECT * FROM journal_entries WHERE id = ?')
      .get(result.lastInsertRowid) as JournalEntry;

    res.status(201).json({ entry });
  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
}

export async function updateJournalEntry(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const { content, mood } = req.body;

  const db = getDb();

  try {
    // Verify ownership
    const entry = db
      .prepare('SELECT * FROM journal_entries WHERE id = ? AND user_id = ?')
      .get(id, req.user.userId) as JournalEntry | undefined;

    if (!entry) {
      res.status(404).json({ error: 'Journal entry not found' });
      return;
    }

    db.prepare(
      'UPDATE journal_entries SET content = ?, mood = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(
      content !== undefined ? content : entry.content,
      mood !== undefined ? mood : entry.mood,
      id
    );

    const updated = db
      .prepare('SELECT * FROM journal_entries WHERE id = ?')
      .get(id) as JournalEntry;

    res.json({ entry: updated });
  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
}

export async function deleteJournalEntry(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const db = getDb();

  try {
    // Verify ownership
    const entry = db
      .prepare('SELECT * FROM journal_entries WHERE id = ? AND user_id = ?')
      .get(id, req.user.userId);

    if (!entry) {
      res.status(404).json({ error: 'Journal entry not found' });
      return;
    }

    db.prepare('DELETE FROM journal_entries WHERE id = ?').run(id);

    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
}
