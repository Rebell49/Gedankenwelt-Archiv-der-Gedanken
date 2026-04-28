import express from 'express';
import adminService from '../services/admin.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { validate, schemas } from '../middleware/validate.middleware.js';
import { AppError } from '../middleware/errorHandler.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Get pending thoughts for moderation
router.get('/moderation/pending', validate(schemas.admin.moderationPending), async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const result = await adminService.getPendingThoughts(limit, offset);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Approve thought
router.post('/moderation/approve/:thoughtId', validate(schemas.admin.moderationAction), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const thought = await adminService.approveThought(req.params.thoughtId, req.user.userId, reason);
    res.json(thought);
  } catch (error) {
    next(error);
  }
});

// Reject thought
router.post('/moderation/reject/:thoughtId', validate(schemas.admin.rejection), async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return next(new AppError('Rejection reason is required', 400));
    }
    const thought = await adminService.rejectThought(req.params.thoughtId, req.user.userId, reason);
    res.json(thought);
  } catch (error) {
    next(error);
  }
});

// Archive thought
router.post('/moderation/archive/:thoughtId', validate(schemas.admin.moderationAction), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const thought = await adminService.archiveThought(req.params.thoughtId, req.user.userId, reason);
    res.json(thought);
  } catch (error) {
    next(error);
  }
});

// Get moderation stats
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await adminService.getModerationStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get('/users', validate(schemas.admin.usersList), async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const result = await adminService.getUsers(limit, offset);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get moderation logs
router.get('/logs', validate(schemas.admin.logs), async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const result = await adminService.getModerationLogs(limit, offset);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete('/users/:userId', validate(schemas.admin.deleteUser), async (req, res, next) => {
  try {
    const result = await adminService.deleteUser(req.params.userId, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
