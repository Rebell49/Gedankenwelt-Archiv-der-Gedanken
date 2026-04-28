import express from 'express';
import anchorsService from '../services/anchors.service.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate, schemas } from '../middleware/validate.middleware.js';
import { AppError } from '../middleware/errorHandler.middleware.js';

const router = express.Router();

// ===== PLANETS =====

// Create planet
router.post('/planets', authenticate, validate(schemas.planets.create), async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const planet = await anchorsService.createPlanet(req.user.userId, name, description, color);
    res.status(201).json(planet);
  } catch (error) {
    next(error);
  }
});

// Get all planets
router.get('/planets', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order || 'desc';

    const result = await anchorsService.getPlanets({
      limit,
      offset,
      sortBy,
      order,
      isPublic: true,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get single planet
router.get('/planets/:id', optionalAuth, async (req, res, next) => {
  try {
    const planet = await anchorsService.getPlanet(req.params.id);
    res.json(planet);
  } catch (error) {
    next(error);
  }
});

// ===== THOUGHTS (ANCHORS) =====

// Create thought on planet
router.post('/planets/:planetId/thoughts', authenticate, validate(schemas.anchors.create), async (req, res, next) => {
  try {
    const { content } = req.body;
    const thought = await anchorsService.createThought(req.user.userId, req.params.planetId, content);
    res.status(201).json(thought);
  } catch (error) {
    next(error);
  }
});

// Get thoughts by planet
router.get('/planets/:planetId/thoughts', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order || 'desc';
    const status = req.query.status || 'APPROVED';

    const result = await anchorsService.getThoughtsByPlanet(req.params.planetId, {
      limit,
      offset,
      sortBy,
      order,
      status,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get single thought
router.get('/thoughts/:id', optionalAuth, async (req, res, next) => {
  try {
    const thought = await anchorsService.getThought(req.params.id);
    res.json(thought);
  } catch (error) {
    next(error);
  }
});

// Update thought
router.put('/thoughts/:id', authenticate, validate(schemas.anchors.update), async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return next(new AppError('Content is required', 400));
    }
    const thought = await anchorsService.updateThought(req.params.id, req.user.userId, content);
    res.json(thought);
  } catch (error) {
    next(error);
  }
});

// Delete thought
router.delete('/thoughts/:id', authenticate, async (req, res, next) => {
  try {
    const result = await anchorsService.deleteThought(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Like/unlike thought
router.post('/thoughts/:id/like', authenticate, async (req, res, next) => {
  try {
    const thought = await anchorsService.toggleLike(req.params.id, req.user.userId);
    res.json(thought);
  } catch (error) {
    next(error);
  }
});

export default router;
