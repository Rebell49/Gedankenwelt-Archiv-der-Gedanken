import { prisma } from '../server.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import moderationService from './moderation.service.js';

export class AdminService {
  // Get all pending thoughts for moderation
  async getPendingThoughts(limit = 50, offset = 0) {
    const thoughts = await prisma.thought.findMany({
      where: {
        status: 'FLAGGED',
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
        planet: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.thought.count({
      where: { status: 'FLAGGED' },
    });

    return { thoughts, total, limit, offset };
  }

  // Approve a thought
  async approveThought(thoughtId, adminId, reason = '') {
    const thought = await prisma.thought.findUnique({
      where: { id: thoughtId },
    });

    if (!thought) {
      throw new AppError('Thought not found', 404);
    }

    // Update thought status
    const updated = await prisma.thought.update({
      where: { id: thoughtId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
      include: {
        author: { select: { id: true, email: true, username: true } },
        planet: { select: { id: true, name: true } },
      },
    });

    // Log the action
    await moderationService.logModerationAction(
      'APPROVED',
      thoughtId,
      'THOUGHT',
      reason || 'Approved by admin',
      adminId
    );

    return updated;
  }

  // Reject a thought
  async rejectThought(thoughtId, adminId, reason) {
    if (!reason) {
      throw new AppError('Rejection reason is required', 400);
    }

    const thought = await prisma.thought.findUnique({
      where: { id: thoughtId },
    });

    if (!thought) {
      throw new AppError('Thought not found', 404);
    }

    const updated = await prisma.thought.update({
      where: { id: thoughtId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        moderationReason: reason,
        moderatorId: adminId,
      },
      include: {
        author: { select: { id: true, email: true, username: true } },
      },
    });

    // Log the action
    await moderationService.logModerationAction(
      'REJECTED',
      thoughtId,
      'THOUGHT',
      reason,
      adminId
    );

    return updated;
  }

  // Get moderation stats
  async getModerationStats() {
    const [
      totalThoughts,
      pendingThoughts,
      approvedThoughts,
      rejectedThoughts,
      flaggedThoughts,
      totalUsers,
      spamCount,
      offensiveCount,
    ] = await Promise.all([
      prisma.thought.count(),
      prisma.thought.count({ where: { status: 'PENDING' } }),
      prisma.thought.count({ where: { status: 'APPROVED' } }),
      prisma.thought.count({ where: { status: 'REJECTED' } }),
      prisma.thought.count({ where: { status: 'FLAGGED' } }),
      prisma.user.count(),
      prisma.thought.count({ where: { isSpam: true } }),
      prisma.thought.count({ where: { isOffensive: true } }),
    ]);

    return {
      totalThoughts,
      byStatus: {
        pending: pendingThoughts,
        approved: approvedThoughts,
        rejected: rejectedThoughts,
        flagged: flaggedThoughts,
      },
      flaggedContent: {
        spam: spamCount,
        offensive: offensiveCount,
      },
      totalUsers,
      averageApprovalRate: totalThoughts > 0 
        ? ((approvedThoughts / totalThoughts) * 100).toFixed(2) 
        : 0,
    };
  }

  // Get all users
  async getUsers(limit = 50, offset = 0) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isAdmin: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            createdThoughts: true,
            createdPlanets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.user.count();

    return { users, total, limit, offset };
  }

  // Get moderation logs
  async getModerationLogs(limit = 50, offset = 0) {
    const logs = await prisma.moderationLog.findMany({
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.moderationLog.count();

    return { logs, total, limit, offset };
  }

  // Delete user (admin only)
  async deleteUser(userId, adminId) {
    if (userId === adminId) {
      throw new AppError('Cannot delete yourself', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Delete user (cascades to their thoughts and planets)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log the action
    await moderationService.logModerationAction(
      'USER_DELETED',
      userId,
      'USER',
      `User account deleted by admin`,
      adminId
    );

    return { success: true };
  }

  // Archive thought
  async archiveThought(thoughtId, adminId, reason) {
    const thought = await prisma.thought.findUnique({
      where: { id: thoughtId },
    });

    if (!thought) {
      throw new AppError('Thought not found', 404);
    }

    const updated = await prisma.thought.update({
      where: { id: thoughtId },
      data: {
        status: 'ARCHIVED',
      },
    });

    // Log the action
    await moderationService.logModerationAction(
      'ARCHIVED',
      thoughtId,
      'THOUGHT',
      reason || 'Archived by admin',
      adminId
    );

    return updated;
  }
}

export default new AdminService();
