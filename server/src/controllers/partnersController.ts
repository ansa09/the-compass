import { Response } from 'express';
import getDb from '../database/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { Partner, Rating } from '../types/index.js';

export async function getPartners(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { status } = req.query;
  const db = getDb();

  try {
    let query = 'SELECT * FROM partners WHERE user_id = ?';
    const params: any[] = [req.user.userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const partners = db.prepare(query).all(...params) as Partner[];

    // Get latest rating for each partner
    const partnersWithRatings = partners.map((partner) => {
      const latestRating = db
        .prepare(
          'SELECT * FROM ratings WHERE partner_id = ? ORDER BY created_at DESC LIMIT 1'
        )
        .get(partner.id) as Rating | undefined;

      return {
        ...partner,
        latest_rating: latestRating || null,
      };
    });

    res.json({ partners: partnersWithRatings });
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({ error: 'Failed to get partners' });
  }
}

export async function getPartner(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const db = getDb();

  try {
    const partner = db
      .prepare('SELECT * FROM partners WHERE id = ? AND user_id = ?')
      .get(id, req.user.userId) as Partner | undefined;

    if (!partner) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    // Get latest rating
    const latestRating = db
      .prepare(
        'SELECT * FROM ratings WHERE partner_id = ? ORDER BY created_at DESC LIMIT 1'
      )
      .get(id) as Rating | undefined;

    res.json({
      partner: {
        ...partner,
        latest_rating: latestRating || null,
      },
    });
  } catch (error) {
    console.error('Get partner error:', error);
    res.status(500).json({ error: 'Failed to get partner' });
  }
}

export async function createPartner(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { first_name, photo_url, date_first_met, status, reminder_threshold } = req.body;

  if (!first_name) {
    res.status(400).json({ error: 'First name is required' });
    return;
  }

  const db = getDb();

  try {
    const result = db
      .prepare(
        'INSERT INTO partners (user_id, first_name, photo_url, date_first_met, status, reminder_threshold) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(
        req.user.userId,
        first_name,
        photo_url || null,
        date_first_met || null,
        status || 'active',
        reminder_threshold || null
      );

    const partner = db
      .prepare('SELECT * FROM partners WHERE id = ?')
      .get(result.lastInsertRowid) as Partner;

    res.status(201).json({ partner });
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({ error: 'Failed to create partner' });
  }
}

export async function updatePartner(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const { first_name, photo_url, date_first_met, status, dates_count, reminder_threshold } =
    req.body;

  const db = getDb();

  try {
    // Verify ownership
    const partner = db
      .prepare('SELECT * FROM partners WHERE id = ? AND user_id = ?')
      .get(id, req.user.userId) as Partner | undefined;

    if (!partner) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    // Update partner
    db.prepare(
      'UPDATE partners SET first_name = ?, photo_url = ?, date_first_met = ?, status = ?, dates_count = ?, reminder_threshold = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(
      first_name !== undefined ? first_name : partner.first_name,
      photo_url !== undefined ? photo_url : partner.photo_url,
      date_first_met !== undefined ? date_first_met : partner.date_first_met,
      status !== undefined ? status : partner.status,
      dates_count !== undefined ? dates_count : partner.dates_count,
      reminder_threshold !== undefined ? reminder_threshold : partner.reminder_threshold,
      id
    );

    const updated = db
      .prepare('SELECT * FROM partners WHERE id = ?')
      .get(id) as Partner;

    res.json({ partner: updated });
  } catch (error) {
    console.error('Update partner error:', error);
    res.status(500).json({ error: 'Failed to update partner' });
  }
}

export async function deletePartner(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const db = getDb();

  try {
    // Verify ownership
    const partner = db
      .prepare('SELECT * FROM partners WHERE id = ? AND user_id = ?')
      .get(id, req.user.userId);

    if (!partner) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    db.prepare('DELETE FROM partners WHERE id = ?').run(id);

    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('Delete partner error:', error);
    res.status(500).json({ error: 'Failed to delete partner' });
  }
}

export async function incrementDatesCount(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const db = getDb();

  try {
    // Verify ownership
    const partner = db
      .prepare('SELECT * FROM partners WHERE id = ? AND user_id = ?')
      .get(id, req.user.userId) as Partner | undefined;

    if (!partner) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    db.prepare(
      'UPDATE partners SET dates_count = dates_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(id);

    const updated = db
      .prepare('SELECT * FROM partners WHERE id = ?')
      .get(id) as Partner;

    res.json({ partner: updated });
  } catch (error) {
    console.error('Increment dates count error:', error);
    res.status(500).json({ error: 'Failed to update dates count' });
  }
}
