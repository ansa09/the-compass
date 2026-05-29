import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import getDb from '../database/db.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';
import { User, UserPublic } from '../types/index.js';

function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    has_completed_onboarding: Boolean(user.has_completed_onboarding),
    default_reminder_threshold: user.default_reminder_threshold,
  };
}

export async function signup(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDb();

  try {
    // Check if user exists
    const existingUser = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email);

    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = db
      .prepare(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
      )
      .run(email, passwordHash, name || null);

    const userId = result.lastInsertRowid as number;

    // Fetch created user
    const user = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(userId) as User;

    // Generate token
    const token = generateToken(userId, email);

    res.status(201).json({
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDb();

  try {
    // Find user
    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as User | undefined;

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const db = getDb();

  try {
    const user = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(req.user.userId) as User | undefined;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
}
