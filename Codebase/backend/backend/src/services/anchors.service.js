import { prisma } from '../server.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import moderationService from './moderation.service.js';

export class AnchorsService {
  // Create a new thought (anchor)
  async createThought(authorId, planetId, content) {
    // Verify planet exists
    const planet = await prisma.planet.findUnique({
      where: { id: planetId },
    });

    if (!planet) {
      throw new AppError('Planet not found', 404);
    }

    // Create thought
    const thought = await prisma.thought.create({
      data: {
        content,
        authorId,
        planetId,
        status: 'PENDING',
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        planet: {
          select: { id: true, name: true },
        },
      },
    });

    // Trigger async moderation
    moderationService.moderateThought(thought.id, content).catch(err => {
      console.error('[MODERATION FAILED]', err.message);
    });

    // Update planet thought count
    await prisma.planet.update({
      where: { id: planetId },
      data: { thoughtCount: { increment: 1 } },
    });

    return thought;
  }

  // Get all thoughts on a planet
  async getThoughtsByPlanet(planetId, filters = {}) {
    const {
      status = 'APPROVED',
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      order = 'desc',
    } = filters;

    const thoughts = await prisma.thought.findMany({
      where: {
        planetId,
        ...(status && { status }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        [sortBy]: order,
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.thought.count({
      where: {
        planetId,
        ...(status && { status }),
      },
    });

    return {
      thoughts,
      total,
      limit,
      offset,
    };
  }

  // Get single thought
  async getThought(thoughtId) {
    const thought = await prisma.thought.findUnique({
      where: { id: thoughtId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        planet: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        moderator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!thought) {
      throw new AppError('Thought not found', 404);
    }

    return thought;
  }

  // Update thought
  async updateThought(thoughtId, userId, contentUpdate) {
    const thought = await prisma.thought.findUnique({
      where: { id: thoughtId },
    });

    if (!thought) {
      throw new AppError('Thought not found', 404);
    }

    if (thought.authorId !== userId) {
      throw new AppError('You can only edit your own thoughts', 403);
    }

    if (thought.status !== 'PENDING' && thought.status !== 'APPROVED') {
      throw new AppError('Cannot edit rejected or flagged thoughts', 400);
    }

    const updated = await prisma.thought.update({
      where: { id: thoughtId },
      data: {
        content: contentUpdate,
        status: 'PENDING', // Reset to pending for re-moderation
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });

    // Re-moderate
    moderationService.moderateThought(updated.id, contentUpdate).catch(err => {
      console.error('[MODERATION FAILED]', err.message);
    });

    return updated;
  }

  // Delete thought
  async deleteThought(thoughtId, userId) {
    const thought = await prisma.thought.findUnique({
      where: { id: thoughtId },
    });

    if (!thought) {
      throw new AppError('Thought not found', 404);
    }

    if (thought.authorId !== userId) {
      throw new AppError('You can only delete your own thoughts', 403);
    }

    // Delete and update planet count
    await prisma.thought.delete({
      where: { id: thoughtId },
    });

    await prisma.planet.update({
      where: { id: thought.planetId },
      data: { thoughtCount: { decrement: 1 } },
    });

    return { success: true };
  }

  // Like/unlike thought
  async toggleLike(thoughtId, userId) {
    const thought = await prisma.thought.findUnique({
      where: { id: thoughtId },
    });

    if (!thought) {
      throw new AppError('Thought not found', 404);
    }

    const likedBy = thought.likedBy || [];
    const hasLiked = likedBy.includes(userId);

    const updated = await prisma.thought.update({
      where: { id: thoughtId },
      data: {
        likedBy: hasLiked
          ? likedBy.filter(id => id !== userId)
          : [...likedBy, userId],
        likes: hasLiked ? { decrement: 1 } : { increment: 1 },
      },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });

    return updated;
  }

  // Create planet
  async createPlanet(creatorId, name, description = '', color = '#3B82F6') {
    const planet = await prisma.planet.create({
      data: {
        name,
        description,
        color,
        creatorId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: { thoughts: true },
        },
      },
    });

    return planet;
  }

  // Get all planets
  async getPlanets(filters = {}) {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      order = 'desc',
      isPublic = true,
    } = filters;

    const planets = await prisma.planet.findMany({
      where: {
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: { thoughts: true },
        },
      },
      orderBy: {
        [sortBy]: order,
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.planet.count({
      where: {
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return {
      planets,
      total,
      limit,
      offset,
    };
  }

  // Get single planet
  async getPlanet(planetId) {
    const planet = await prisma.planet.findUnique({
      where: { id: planetId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            thoughts: true,
          },
        },
      },
    });

    if (!planet) {
      throw new AppError('Planet not found', 404);
    }

    return planet;
  }
}

export default new AnchorsService();
