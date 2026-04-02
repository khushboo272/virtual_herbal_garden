export const swaggerSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Virtual Herbal Garden API',
    version: '1.0.0',
    description: 'Complete REST API for the Virtual Herbal Garden platform — MongoDB Edition',
    contact: { name: 'VHG Team' },
  },
  servers: [
    { url: '/api/v1', description: 'API v1' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'refreshToken' },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          meta: { $ref: '#/components/schemas/PaginationMeta' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' }, email: { type: 'string' },
          displayName: { type: 'string' }, role: { type: 'string', enum: ['GUEST','USER','BOTANIST','ADMIN','SUPER_ADMIN'] },
          avatarUrl: { type: 'string', nullable: true }, bio: { type: 'string', nullable: true },
          isEmailVerified: { type: 'boolean' }, is2faEnabled: { type: 'boolean' },
          isActive: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Plant: {
        type: 'object',
        properties: {
          _id: { type: 'string' }, commonName: { type: 'string' }, scientificName: { type: 'string' },
          slug: { type: 'string' }, family: { type: 'string' }, description: { type: 'string' },
          medicinalUses: { type: 'array', items: { type: 'string' } },
          toxicityLevel: { type: 'string', enum: ['NONE','LOW','MODERATE','HIGH'] },
          images: { type: 'array', items: { type: 'object' } },
          avgRating: { type: 'number' }, reviewCount: { type: 'integer' },
          isPublished: { type: 'boolean' }, isFeatured: { type: 'boolean' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register new user',
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email','password','displayName'], properties: { email: { type: 'string' }, password: { type: 'string' }, displayName: { type: 'string' } } } } } },
        responses: { '201': { description: 'User registered' }, '409': { description: 'Email exists' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login',
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email','password'], properties: { email: { type: 'string' }, password: { type: 'string' }, totpCode: { type: 'string' } } } } } },
        responses: { '200': { description: 'Login successful' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/auth/refresh': { post: { tags: ['Auth'], summary: 'Refresh access token', responses: { '200': { description: 'New access token' } } } },
    '/auth/logout': { post: { tags: ['Auth'], summary: 'Logout', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Logged out' } } } },
    '/auth/logout-all': { post: { tags: ['Auth'], summary: 'Logout all devices', security: [{ bearerAuth: [] }], responses: { '200': { description: 'All sessions revoked' } } } },
    '/auth/verify-email': { post: { tags: ['Auth'], summary: 'Verify email OTP', responses: { '200': { description: 'Email verified' } } } },
    '/auth/forgot-password': { post: { tags: ['Auth'], summary: 'Send password reset', responses: { '200': { description: 'Reset link sent' } } } },
    '/auth/reset-password': { post: { tags: ['Auth'], summary: 'Reset password', responses: { '200': { description: 'Password reset' } } } },
    '/auth/2fa/setup': { post: { tags: ['Auth'], summary: 'Setup 2FA', security: [{ bearerAuth: [] }], responses: { '200': { description: 'QR code returned' } } } },
    '/auth/2fa/verify': { post: { tags: ['Auth'], summary: 'Verify 2FA', security: [{ bearerAuth: [] }], responses: { '200': { description: '2FA enabled' } } } },
    '/auth/google': { get: { tags: ['Auth'], summary: 'Google OAuth2 redirect', responses: { '302': { description: 'Redirect to Google' } } } },
    '/plants': {
      get: { tags: ['Plants'], summary: 'List plants', parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'category', in: 'query', schema: { type: 'string' } },
        { name: 'tags', in: 'query', schema: { type: 'string' } }, { name: 'sort', in: 'query', schema: { type: 'string' } },
      ], responses: { '200': { description: 'Plant list' } } },
      post: { tags: ['Plants'], summary: 'Create plant', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Plant created' } } },
    },
    '/plants/featured': { get: { tags: ['Plants'], summary: 'Featured plants', responses: { '200': { description: 'Featured plants' } } } },
    '/plants/{slug}': { get: { tags: ['Plants'], summary: 'Plant detail', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Plant detail' } } } },
    '/plants/{id}/reviews': {
      get: { tags: ['Plants'], summary: 'Plant reviews', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Reviews list' } } },
      post: { tags: ['Plants'], summary: 'Submit review', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Review created' } } },
    },
    '/remedies': {
      get: { tags: ['Remedies'], summary: 'List remedies', responses: { '200': { description: 'Remedy list' } } },
      post: { tags: ['Remedies'], summary: 'Create remedy', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Remedy created' } } },
    },
    '/remedies/{slug}': { get: { tags: ['Remedies'], summary: 'Remedy detail', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Remedy detail' } } } },
    '/ai/detect': { post: { tags: ['AI'], summary: 'Submit detection', security: [{ bearerAuth: [] }], requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } } } }, responses: { '202': { description: 'Detection queued' } } } },
    '/ai/detect/{jobId}': { get: { tags: ['AI'], summary: 'Poll detection', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Detection status' } } } },
    '/ai/history': { get: { tags: ['AI'], summary: 'Detection history', security: [{ bearerAuth: [] }], responses: { '200': { description: 'History' } } } },
    '/users/me': {
      get: { tags: ['Users'], summary: 'Get profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'User profile' } } },
      patch: { tags: ['Users'], summary: 'Update profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Profile updated' } } },
      delete: { tags: ['Users'], summary: 'Delete account', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Account deleted' } } },
    },
    '/users/me/garden': { get: { tags: ['Garden'], summary: 'Get garden', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Garden data' } } } },
    '/users/me/garden/plants': { post: { tags: ['Garden'], summary: 'Add plant to garden', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Plant added' } } } },
    '/users/me/bookmarks': {
      get: { tags: ['Users'], summary: 'Get bookmarks', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Bookmarks' } } },
      post: { tags: ['Users'], summary: 'Create bookmark', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Bookmark created' } } },
    },
    '/admin/stats/overview': { get: { tags: ['Admin'], summary: 'Dashboard stats', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Stats' } } } },
    '/admin/users': { get: { tags: ['Admin'], summary: 'List users', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Users' } } } },
    '/tours': {
      get: { tags: ['Tours'], summary: 'List tours', responses: { '200': { description: 'Tours' } } },
      post: { tags: ['Tours'], summary: 'Create tour', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Tour created' } } },
    },
  },
};
