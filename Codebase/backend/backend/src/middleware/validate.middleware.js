import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.validated = validated;
    next();
  } catch (error) {
    next(error);
  }
};

// Validation schemas
export const schemas = {
  auth: {
    register: z.object({
      body: z.object({
        email: z.string().email('Invalid email address'),
        username: z.string().min(3, 'Username must be at least 3 characters').max(100),
        password: z.string().min(8, 'Password must be at least 8 characters'),
      }),
    }),
    login: z.object({
      body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
      }),
    }),
    refresh: z.object({
      body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
      }),
    }),
    updateProfile: z.object({
      body: z.object({
        displayName: z.string().min(1).max(150).optional(),
        avatar: z.string().url('Avatar must be a valid URL').optional(),
        bio: z.string().max(500).optional(),
      }),
    }),
  },
  anchors: {
    create: z.object({
      body: z.object({
        content: z.string().min(1, 'Content is required').max(5000),
      }),
      params: z.object({
        planetId: z.string().min(1, 'Planet ID is required'),
      }),
    }),
    update: z.object({
      body: z.object({
        content: z.string().min(1).max(5000).optional(),
      }),
      params: z.object({
        id: z.string(),
      }),
    }),
  },
  planets: {
    create: z.object({
      body: z.object({
        name: z.string().min(1, 'Name is required').max(150),
        description: z.string().max(1000).optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
      }),
    }),
  },
};
