import { z } from 'zod';

const formatValidationError = (errors) => {
  return errors.map(e => ({
    path: e.path.join('.'),
    message: e.message,
  }));
};

export const validate = (schema) => (req, res, next) => {
  const validated = {
    body: req.body,
    query: req.query,
    params: req.params,
  };

  const parseResult = {
    body: schema.body ? schema.body.safeParse(req.body) : { success: true, data: req.body },
    query: schema.query ? schema.query.safeParse(req.query) : { success: true, data: req.query },
    params: schema.params ? schema.params.safeParse(req.params) : { success: true, data: req.params },
  };

  if (!parseResult.body.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: formatValidationError(parseResult.body.error.errors),
    });
  }

  if (!parseResult.query.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: formatValidationError(parseResult.query.error.errors),
    });
  }

  if (!parseResult.params.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid route parameters',
      details: formatValidationError(parseResult.params.error.errors),
    });
  }

  req.validated = {
    body: parseResult.body.data,
    query: parseResult.query.data,
    params: parseResult.params.data,
  };

  next();
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
    getPlanet: z.object({
      params: z.object({
        id: z.string().min(1, 'Planet ID is required'),
      }),
    }),
    getThought: z.object({
      params: z.object({
        id: z.string().min(1, 'Thought ID is required'),
      }),
    }),
    getThoughtsByPlanet: z.object({
      params: z.object({
        planetId: z.string().min(1, 'Planet ID is required'),
      }),
      query: z.object({
        limit: z.string().optional(),
        offset: z.string().optional(),
        sortBy: z.string().optional(),
        order: z.string().optional(),
        status: z.string().optional(),
      }),
    }),
    listPlanets: z.object({
      query: z.object({
        limit: z.string().optional(),
        offset: z.string().optional(),
        sortBy: z.string().optional(),
        order: z.string().optional(),
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
  admin: {
    moderationPending: z.object({
      query: z.object({
        limit: z.string().optional(),
        offset: z.string().optional(),
      }),
    }),
    moderationAction: z.object({
      params: z.object({
        thoughtId: z.string().min(1, 'Thought ID is required'),
      }),
      body: z.object({
        reason: z.string().optional(),
      }).optional(),
    }),
    rejection: z.object({
      params: z.object({
        thoughtId: z.string().min(1, 'Thought ID is required'),
      }),
      body: z.object({
        reason: z.string().min(1, 'Rejection reason is required'),
      }),
    }),
    deleteUser: z.object({
      params: z.object({
        userId: z.string().min(1, 'User ID is required'),
      }),
    }),
    usersList: z.object({
      query: z.object({
        limit: z.string().optional(),
        offset: z.string().optional(),
      }),
    }),
    logs: z.object({
      query: z.object({
        limit: z.string().optional(),
        offset: z.string().optional(),
      }),
    }),
  },
};
