import axios from 'axios';
import { prisma } from '../server.js';
import { AppError } from '../middleware/errorHandler.middleware.js';

export class ModerationService {
  async moderateThought(thoughtId, content) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // Call OpenAI moderation API
        const response = await axios.post(
          'https://api.openai.com/v1/moderations',
          { input: content },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: parseInt(process.env.MODERATION_TIMEOUT_MS || '10000'),
          }
        );

        const { results } = response.data;
        const result = results[0];

        // Determine moderation status
        let status = 'APPROVED';
        let flags = [];
        let isOffensive = false;
        let isSpam = false;

        if (result.flagged) {
          status = 'FLAGGED';
          
          // Check specific categories
          const categories = result.categories;
          if (categories.hate || categories.hate_threatening) {
            flags.push('hate_speech');
            isOffensive = true;
          }
          if (categories.harassment) {
            flags.push('harassment');
            isOffensive = true;
          }
          if (categories.violence) {
            flags.push('violence');
            isOffensive = true;
          }
          if (categories.sexual) {
            flags.push('sexual_content');
            isOffensive = true;
          }
          if (categories.self_harm) {
            flags.push('self_harm');
            isOffensive = true;
          }
        }

        // Simple spam detection (very short repetitive content)
        if (this.isLikelySpam(content)) {
          flags.push('likely_spam');
          isSpam = true;
          status = 'FLAGGED';
        }

        // Update thought with moderation results
        const updatedThought = await prisma.thought.update({
          where: { id: thoughtId },
          data: {
            status: status === 'FLAGGED' ? 'FLAGGED' : 'APPROVED',
            isOffensive,
            isSpam,
            flaggedBy: flags.length > 0 ? JSON.stringify(flags) : null,
            ...(status === 'APPROVED' && { approvedAt: new Date() }),
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            planet: {
              select: { id: true, name: true },
            },
          },
        });

        return updatedThought;
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          console.error('[MODERATION ERROR]', error.message);
          
          // Fallback: approve with manual review flag if API fails
          const updatedThought = await prisma.thought.update({
            where: { id: thoughtId },
            data: {
              status: 'FLAGGED',
              flaggedBy: JSON.stringify(['api_error', 'requires_manual_review']),
            },
          });
          return updatedThought;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  isLikelySpam(content) {
    // Simple heuristics for spam detection
    const trimmed = content.trim();
    
    // Too short
    if (trimmed.length < 5) return true;
    
    // Mostly URLs
    const urlCount = (content.match(/https?:\/\/\S+/g) || []).length;
    if (urlCount > 3) return true;
    
    // Repeated characters
    if (/(.)\1{9,}/.test(trimmed)) return true;
    
    // Single repeated word
    const words = trimmed.split(/\s+/);
    if (words.length > 0) {
      const uniqueWords = new Set(words);
      if (uniqueWords.size === 1 && words.length > 10) return true;
    }
    
    return false;
  }

  async logModerationAction(action, targetId, targetType, reason, adminId) {
    await prisma.moderationLog.create({
      data: {
        action,
        targetId,
        targetType,
        reason,
        adminId,
      },
    });
  }

  async getThoughtModerationStatus(thoughtId) {
    const thought = await prisma.thought.findUnique({
      where: { id: thoughtId },
      select: {
        id: true,
        status: true,
        isOffensive: true,
        isSpam: true,
        flaggedBy: true,
        moderationReason: true,
        approvedAt: true,
        rejectedAt: true,
      },
    });

    if (!thought) {
      throw new AppError('Thought not found', 404);
    }

    return thought;
  }
}

export default new ModerationService();
