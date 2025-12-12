import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth/auth.service';
import { UserRole } from '../types/auth';

const router = Router();

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      role: z.nativeEnum(UserRole).optional(),
    });

    const data = schema.parse(req.body);
    const result = await authService.register(data);

    res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    console.error('Registration error:', error);
    res.status(400).json({ error: message });
  }
});

// POST /api/auth/login - Login existing user
router.post('/login', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const data = schema.parse(req.body);
    const result = await authService.login(data);

    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    console.error('Login error:', error);
    res.status(401).json({ error: message });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    const authToken = authService.verifyToken(token);
    const user = await authService.getUserById(authToken.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    console.error('Get user error:', error);
    res.status(401).json({ error: message });
  }
});

export default router;
