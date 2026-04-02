# Virtual Herbal Garden — Backend Build Walkthrough

## Summary

Built the complete production-ready backend for the Virtual Herbal Garden platform in **67 tasks across 14 phases**. The backend is a Node.js + TypeScript + Express.js + MongoDB (Mongoose) application located at `d:\production_project\virtual_herbal_garden\backend\`.

## Architecture

```
backend/
├── src/
│   ├── config/          # env, db, redis, s3, passport
│   ├── models/          # 14 Mongoose models
│   ├── validators/      # 8 Zod validator files
│   ├── utils/           # 8 utility modules
│   ├── middleware/       # 7 middleware files
│   ├── services/        # 11 service classes
│   ├── jobs/            # BullMQ queues + 2 workers
│   ├── socket/          # Socket.io + Change Streams
│   ├── controllers/     # 9 controller classes
│   ├── routes/          # 9 route files + master router
│   ├── types/           # TypeScript types + Express augment
│   ├── app.ts           # Express app setup
│   ├── server.ts        # Bootstrap + graceful shutdown
│   └── swagger.ts       # OpenAPI 3.1 spec
├── tests/               # 5 test files (Jest + mongodb-memory-server)
├── Dockerfile           # Multi-stage production build
├── docker-compose.yml   # API + MongoDB (replica) + Redis
├── .github/workflows/   # CI pipeline
└── package.json         # All dependencies installed
```

## Key Features Implemented

| Feature | Implementation |
|---------|---------------|
| **Auth** | JWT RS256, refresh token rotation (SHA-256 hashed), bcrypt (12 rounds), Google OAuth2, TOTP 2FA |
| **RBAC** | 5 roles with hierarchy: GUEST→USER→BOTANIST→ADMIN→SUPER_ADMIN |
| **Plants** | Full CRUD, Atlas Search fallback, featured caching (Redis 5min), atomic viewCount |
| **Reviews** | Post-save hook for avgRating recalculation via aggregation pipeline |
| **Garden** | Embedded 3D plant placements with $push/$pull/$set operators |
| **AI Detection** | BullMQ job queue → Python microservice call → MongoDB Change Stream → Socket.io push |
| **Admin** | MongoDB aggregation pipelines for analytics, user/content management, audit logs |
| **Security** | Helmet, CORS, mongo-sanitize, rate limiting (Redis store), magic bytes validation |
| **Real-time** | Socket.io with JWT auth, user rooms, Change Streams for detection/notification/admin alerts |
| **Storage** | S3 upload with sharp processing (3 variants + WebP + LQIP) |
| **TTL Indexes** | Detections (30d), Notifications (90d), Audit Logs (12mo), Refresh Tokens (30d) |

## What Was Tested
- All dependencies installed successfully via `npm install`
- 82 source files created in the `src/` directory
- 5 test files covering auth, plants, garden, and AI detection
- Jest configured with mongodb-memory-server for isolated testing

## Next Steps
1. Copy `.env.example` to `.env` and fill in real credentials
2. Generate RS256 key pair for JWT signing
3. Run `docker-compose up` to start MongoDB + Redis locally
4. Run `npm run dev` to start the development server
5. Run `npm test` to execute the test suite
