import express from 'express';
import authService from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, schemas } from '../middleware/validate.middleware.js';
import { AppError, success } from '../middleware/errorHandler.middleware.js';

const router = express.Router();

// Register
router.post('/register', validate(schemas.auth.register), async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const result = await authService.register(email, username, password);
    return success(res, result, 201);
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', validate(schemas.auth.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return success(res, result);
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', validate(schemas.auth.refresh), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    return success(res, tokens);
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.userId);
    return success(res, user);
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/profile', authenticate, validate(schemas.auth.updateProfile), async (req, res, next) => {
  try {
    const { displayName, avatar, bio } = req.body;
    const user = await authService.updateProfile(req.user.userId, {
      displayName,
      avatar,
      bio,
    });
    return success(res, user);
  } catch (error) {
    next(error);
  }
});

// Logout (client-side in reality, but endpoint exists for completeness)
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
