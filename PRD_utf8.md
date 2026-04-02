≡ƒî┐

__VIRTUAL HERBAL GARDEN__

__Backend System ΓÇö MongoDB Edition__

Product Requirements Document \(PRD\) v2\.0

__Version__

2\.0\.0 ΓÇö MongoDB

__Database__

MongoDB \+ Mongoose

__Status__

Draft for Review

__Date__

March 2026

__Project__

Virtual Herbal Garden Platform

*Confidential ΓÇô Internal Use Only*

# __1\. Executive Summary__

The Virtual Herbal Garden is a Next\.js/React \+ TypeScript frontend with 11 component screens currently serving static data\. This PRD defines the complete backend built on MongoDB, Node\.js, and Mongoose to make the platform fully dynamic, authenticated, and production\-ready\. MongoDB was chosen for its flexible document model ΓÇö ideal for rich plant records with variable attributes, nested remedy steps, user garden states, and AI detection payloads\.

## __1\.1 Why MongoDB for This Project__

__Reason__

__Detail__

__Flexible Plant Schema__

Plants have wildly different attributes \(Ayurvedic herbs vs\. Western botanicals\)\. BSON documents handle this without ALTER TABLE migrations\.

__Embedded Documents__

Growing conditions, image variants, medicinal uses ΓÇö all naturally embedded inside the plant document for single\-query reads\.

__Geospatial Queries__

MongoDB's 2dsphere index enables location\-based filtering of plants native to a geographic region\.

__AI Payload Storage__

Detection results with variable prediction arrays store naturally as BSON arrays with no schema migration needed\.

__3D Garden State__

Per\-user garden JSON with arbitrary plant positions maps directly to a MongoDB document with no joins\.

__Horizontal Scalability__

Replica sets \+ sharding for future scale\. Atlas provides managed clustering out of the box\.

## __1\.2 Frontend Component ΓåÆ Backend Mapping__

__Component__

__Current State__

__MongoDB Collection\(s\) Required__

HomePage\.tsx

Static hero \+ features

plants \(featured\), stats aggregation

PlantLibrary\.tsx

Hard\-coded plant cards

plants, categories, tags

PlantDetail\.tsx

Static plant info

plants, reviews, bookmarks

AIPlantDetection\.tsx

UI only, no ML

detections, plants

VirtualGarden3D\.tsx

Static 3D scene

gardens \(embedded plants\)

VirtualTour\.tsx

Static tour steps

tours \(embedded stops\)

RemediesPage\.tsx

Static remedy cards

remedies, plants \(ref\)

UserDashboard\.tsx

Static dashboard UI

users, bookmarks, activity\_logs

AdminPanel\.tsx

Static admin UI

users, audit\_logs, all collections

MobileView\.tsx

Responsive layout

Same API, PWA manifest endpoint

# __2\. Technology Stack & Architecture__

## __2\.1 Full Stack ΓÇö MongoDB Edition__

__Layer__

__Technology__

__Rationale__

__Runtime__

Node\.js 20 LTS

Matches frontend ecosystem, excellent async I/O for MongoDB

__Framework__

Express\.js \+ TypeScript 5

Minimal, mature, huge ecosystem; type safety matches frontend

__Database__

MongoDB 7 \(Atlas\)

Primary datastore\. Atlas free tier for dev, M10\+ for production

__ODM__

Mongoose 8

Schema validation, virtuals, middleware hooks, TypeScript support

__Cache__

Redis 7 \(Upstash/ElastiCache\)

Session store, rate limiting, API response caching, BullMQ jobs

__Search__

MongoDB Atlas Search

Lucene\-based full\-text search built into Atlas ΓÇö no extra service

__File Storage__

AWS S3 / Cloudflare R2

Images, 3D models, tour media ΓÇö URLs stored in MongoDB documents

__AI Microservice__

Python FastAPI

ML inference isolated; results written back to MongoDB via callback

__Auth__

Passport\.js \+ JWT RS256

Local \+ Google OAuth2; refresh tokens stored in MongoDB collection

__Job Queue__

BullMQ \(Redis\-backed\)

Async AI detection jobs, email sending, image processing

__Real\-Time__

Socket\.io

AI result push, notifications ΓÇö pairs well with MongoDB change streams

__API Docs__

Swagger / OpenAPI 3\.1

Auto\-generated docs served at /api/docs

__Validation__

Zod \(request\) \+ Mongoose \(DB\)

Double\-layer validation: route\-level and schema\-level

__Testing__

Jest \+ Supertest \+ mongodb\-memory\-server

In\-memory MongoDB for fast isolated tests

__Monitoring__

MongoDB Atlas monitoring \+ Prometheus

Query performance, slow ops, index usage dashboards

## __2\.2 Architecture Diagram__

__System Architecture ΓÇö Virtual Herbal Garden \+ MongoDB__

__\[ React / Next\.js Frontend \]__

         Γåò  REST API / HTTPS / Socket\.io WebSocket

__\[ Express\.js API  |  JWT Auth Middleware  |  Rate Limiter \]__

         Γåò  Mongoose ODM                   Γåò  HTTP/Queue

__\[ Business Logic Services \]         \[ Python AI Microservice \]__

         Γåò                                  Γåò writes results to MongoDB

__\[ MongoDB Atlas \]  \[ Redis / BullMQ \]  \[ AWS S3 / CDN \]__

## __2\.3 MongoDB Atlas Setup__

- Use MongoDB Atlas M0 \(free\) for local/dev, M10 dedicated cluster for staging/production
- Enable Atlas Search indexes on plants and remedies collections for full\-text search
- Enable Atlas App Services for real\-time change streams if needed
- IP whitelist \+ VPC peering for production; connection string via environment variable
- Enable automated backups \(daily snapshots, 7\-day retention\) on production cluster

# __3\. Authentication & Role\-Based Access Control__

## __3\.1 User Roles__

__Role__

__Level__

__Permissions__

__SUPER\_ADMIN__

Full System

Manage all users, roles, system config, delete any content, view all analytics, manage admin accounts\.

__ADMIN__

Content Mgmt

Add/edit/delete plants & remedies, approve submissions, manage regular users, view reports\.

__BOTANIST__

Expert Contrib\.

Create/edit plants & remedies, write articles, validate AI detections, answer user queries\.

__USER__

Standard

Browse content, use AI detection, save plants, manage personal garden, write reviews\.

__GUEST__

Read\-Only

Browse plant library, view remedies, read public articles\. Cannot save or interact\.

## __3\.2 Auth Flow & Token Strategy__

- JWT Access Token ΓÇö RS256, 1\-hour expiry, signed with private key
- Refresh Token ΓÇö 30\-day expiry, stored as hashed document in refresh\_tokens collection
- Refresh token rotation: new refresh token issued on every /auth/refresh call; old one revoked
- OAuth2: Google \(GitHub optional\) ΓÇö user document created/updated on callback
- 2FA: TOTP \(Google Authenticator compatible\) ΓÇö mandatory for ADMIN\+, optional for USER
- Password hashing: bcrypt, salt rounds = 12
- Rate limiting on /auth/\* ΓÇö 5 failed logins ΓåÆ 15\-minute account lockout stored in Redis

## __3\.3 Permission Matrix__

__Action__

__GUEST__

__USER__

__BOTANIST__

__ADMIN__

__SUPER\_ADMIN__

View Plants / Remedies

Γ£à

Γ£à

Γ£à

Γ£à

Γ£à

Use AI Detection

Γ¥î

Γ£à

Γ£à

Γ£à

Γ£à

Bookmark / Save Plants

Γ¥î

Γ£à

Γ£à

Γ£à

Γ£à

Write Reviews

Γ¥î

Γ£à

Γ£à

Γ£à

Γ£à

Manage Virtual Garden

Γ¥î

Γ£à

Γ£à

Γ£à

Γ£à

Create / Edit Plants

Γ¥î

Γ¥î

Γ£à

Γ£à

Γ£à

Validate AI Detections

Γ¥î

Γ¥î

Γ£à

Γ£à

Γ£à

Manage All Users

Γ¥î

Γ¥î

Γ¥î

Γ£à

Γ£à

Delete Any Content

Γ¥î

Γ¥î

Γ¥î

Γ£à

Γ£à

Manage Admin Accounts

Γ¥î

Γ¥î

Γ¥î

Γ¥î

Γ£à

System Configuration

Γ¥î

Γ¥î

Γ¥î

Γ¥î

Γ£à

# __4\. MongoDB Collections & Schema Design__

MongoDB uses a document model\. The design below follows Mongoose schema conventions\. Key design decisions: embed data that is always read together; use references \(ObjectId\) only for data accessed independently\. All \_id fields are MongoDB ObjectIds\.

## __4\.1 Collection: users__

Stores all user accounts\. OAuth accounts are embedded as an array to avoid a separate join\.

__Field__

__Type__

__Constraints__

__Description__

__\_id__

ObjectId

auto

Primary identifier

email

String

unique, required

Login email

passwordHash

String

nullable

bcrypt hash; null for OAuth\-only users

role

String \(enum\)

required

GUEST | USER | BOTANIST | ADMIN | SUPER\_ADMIN

displayName

String

required

Public name shown on reviews and profile

avatarUrl

String

nullable

S3 URL to profile picture

bio

String

max 500

Short bio \(visible on Botanist profiles\)

isEmailVerified

Boolean

default: false

Email verification status

is2faEnabled

Boolean

default: false

TOTP 2FA flag

totpSecret

String

encrypted

AES\-256 encrypted TOTP secret

isActive

Boolean

default: true

Account active / banned flag

banReason

String

nullable

Reason if account is banned

oauthAccounts

Array<Object>

embedded

\[\{ provider, providerUserId, accessToken\(enc\) \}\]

loginAttempts

Number

default: 0

Failed login counter for lockout

lockUntil

Date

nullable

Account unlock timestamp after lockout

lastLoginAt

Date

nullable

Last successful login

createdAt

Date

auto

Account creation \(Mongoose timestamps\)

updatedAt

Date

auto

Last update \(Mongoose timestamps: true\)

__Indexes: __\{ email: 1 \} unique  |  \{ role: 1 \}  |  \{ createdAt: \-1 \}

## __4\.2 Collection: plants__

Rich document with embedded sub\-documents for growing conditions, images, and medicinal uses\. Variable herb attributes stored in a flexible attributes map\.

__Field__

__Type__

__Constraints__

__Description__

__\_id__

ObjectId

auto

Primary identifier

commonName

String

required

Primary common name e\.g\. Tulsi, Neem

scientificName

String

unique, required

Latin binomial e\.g\. Ocimum tenuiflorum

slug

String

unique, required

URL\-safe slug for routing

family

String

required

Plant family e\.g\. Lamiaceae

description

String

required

Full rich\-text description

shortDescription

String

max 500

Card preview text

medicinalUses

\[String\]

required

Array of medicinal use strings

partsUsed

\[String\]

enum values

leaves | roots | bark | seeds | flowers | resin

toxicityLevel

String \(enum\)

required

NONE | LOW | MODERATE | HIGH

ayurvedicNames

\[String\]

nullable

Sanskrit / Ayurvedic alternative names

regionNative

\[String\]

required

Native geographic regions

growingConditions

Object

embedded

\{ soil, water, sunlight, climate, hardinessZone \}

images

\[Object\]

embedded

\[\{ url, alt, isPrimary, type, width, height \}\]

model3dUrl

String

nullable

S3 URL to \.glb / \.gltf 3D model

categories

\[ObjectId\]

ref: Category

References to category documents

tags

\[String\]

indexed

Free\-form tag slugs e\.g\. \['adaptogen','tonic'\]

attributes

Map<String,Any>

flexible

Herb\-specific extras e\.g\. \{ rasa, guna, dosha \}

isPublished

Boolean

default: false

Published / draft status

isFeatured

Boolean

default: false

Featured on homepage

createdBy

ObjectId

ref: User

Author \(botanist or admin\)

avgRating

Number

default: 0

Denormalized average, updated on review write

reviewCount

Number

default: 0

Denormalized count for display

viewCount

Number

default: 0

Page view counter \(atomic $inc\)

createdAt/updatedAt

Date

timestamps: true

Mongoose auto timestamps

__Indexes: __\{ slug: 1 \} unique  |  \{ scientificName: 1 \} unique  |  \{ isPublished: 1, isFeatured: 1 \}  |  \{ tags: 1 \}  |  Atlas Search index on commonName \+ description \+ medicinalUses

## __4\.3 Collection: remedies__

Preparation steps are embedded as an ordered array\. Plant references are ObjectId arrays pointing to the plants collection\.

__Field__

__Type__

__Constraints__

__Description__

__\_id__

ObjectId

auto

Primary identifier

title

String

required

Remedy title e\.g\. Tulsi Ginger Kadha

slug

String

unique

URL\-safe slug

description

String

required

What the remedy treats / overview

plants

\[ObjectId\]

ref: Plant

Plant\(s\) used in this remedy

ingredients

\[Object\]

embedded

\[\{ plantId, partUsed, quantity, unit, notes \}\]

preparationSteps

\[Object\]

embedded

\[\{ step, instruction, durationMinutes, imageUrl \}\]

dosage

String

required

Recommended dosage and frequency

contraindications

\[String\]

nullable

Who should avoid this remedy

difficultyLevel

String

enum

EASY | MEDIUM | ADVANCED

preparationTime

Number

minutes

Total prep time in minutes

images

\[Object\]

embedded

\[\{ url, alt, isPrimary \}\]

tags

\[String\]

indexed

e\.g\. \['immunity','digestion','ayurvedic'\]

isPublished

Boolean

default: false

Draft / published status

createdBy

ObjectId

ref: User

Author reference

createdAt/updatedAt

Date

timestamps

Auto timestamps

__Indexes: __\{ slug: 1 \} unique  |  \{ plants: 1 \}  |  \{ tags: 1 \}  |  \{ isPublished: 1 \}  |  Atlas Search index on title \+ description

## __4\.4 Collection: reviews__

Separate collection \(not embedded in plants\) to allow independent pagination, moderation, and querying across all plants\.

__Field__

__Type__

__Constraints__

__Description__

__\_id__

ObjectId

auto

Primary identifier

plant

ObjectId

ref: Plant, index

Plant being reviewed

user

ObjectId

ref: User

Review author

rating

Number

1\-5, required

Star rating

title

String

max 200

Review headline

body

String

max 2000

Full review text

helpfulCount

Number

default: 0

Upvotes from other users

isFlagged

Boolean

default: false

Flagged for admin moderation

flagReason

String

nullable

Reason for flagging

createdAt

Date

timestamps

Auto timestamp

__Indexes: __\{ plant: 1, createdAt: \-1 \}  |  \{ user: 1 \}  |  \{ isFlagged: 1 \}  |  \{ plant: 1, user: 1 \} unique \(one review per user per plant\)

## __4\.5 Collection: gardens__

One document per user\. Plant placement objects are embedded ΓÇö they are always read/written together with the garden\. Virtual garden state maps perfectly to a single MongoDB document\.

__Field__

__Type__

__Constraints__

__Description__

__\_id__

ObjectId

auto

Primary identifier

user

ObjectId

ref: User, unique

Owner \(1\-to\-1 with user\)

name

String

default: 'My Garden'

User\-given garden name

description

String

nullable

Optional garden description

plants

\[Object\]

embedded array

All placed plants with 3D state \(see below\)

plants\[\]\.plant

ObjectId

ref: Plant

Reference to plant document

plants\[\]\.position

Object

\{ x, y, z \}

3D world\-space position coordinates

plants\[\]\.rotation

Object

\{ x, y, z \}

Euler rotation angles

plants\[\]\.scale

Number

default: 1

Uniform scale factor

plants\[\]\.growthStage

String

enum

SEED | SPROUT | YOUNG | MATURE | FLOWERING

plants\[\]\.plantedAt

Date

default: now

When user added plant to garden

plants\[\]\.notes

String

nullable

User personal notes about this plant

createdAt/updatedAt

Date

timestamps

Auto timestamps

__Indexes: __\{ user: 1 \} unique  |  \{ 'plants\.plant': 1 \}

## __4\.6 Collection: detections__

Stores AI plant detection jobs\. Predictions are embedded as an ordered array\. Feedback from botanists is also embedded to keep the full detection history in one document\.

__Field__

__Type__

__Constraints__

__Description__

__\_id__

ObjectId

auto

Primary identifier

user

ObjectId

ref: User, index

Who submitted the detection

imageUrl

String

required

S3 URL of uploaded image \(temp bucket\)

imageThumbnailUrl

String

nullable

Resized thumbnail for display

status

String

enum

PENDING | PROCESSING | COMPLETE | FAILED

predictions

\[Object\]

embedded

\[\{ plant\(ref\), confidence, rank, commonName \}\]

topMatch

ObjectId

ref: Plant

Top\-1 prediction plant reference

modelVersion

String

required

ML model version used e\.g\. v2\.3\.1

processingTimeMs

Number

nullable

Inference duration in milliseconds

feedback

Object

embedded

\{ reviewer\(ref\), isCorrect, correctPlant, notes, reviewedAt \}

errorMessage

String

nullable

Error detail if status = FAILED

expiresAt

Date

TTL index

Auto\-delete after 30 days \(MongoDB TTL index\)

createdAt/updatedAt

Date

timestamps

Auto timestamps

__Indexes: __\{ user: 1, createdAt: \-1 \}  |  \{ status: 1 \}  |  \{ expiresAt: 1 \} TTL index \(expireAfterSeconds: 0\)  |  \{ topMatch: 1 \}

## __4\.7 Remaining Collections ΓÇö Summary__

__Collection__

__Key Fields & Design Notes__

__tours__

\_id, slug, title, description, difficulty, estimatedDuration, coverImageUrl, stops\[\]\(embedded: \{ order, plant\(ref\), title, description, mediaUrl, mediaType, coordinates3d \}\), isPublished, createdBy, timestamps

__bookmarks__

\_id, user\(ref\), entityType\(PLANT|REMEDY|ARTICLE\), entityId\(ObjectId\), collectionName, notes, createdAt\. Compound unique index \{ user, entityType, entityId \}\.

__categories__

\_id, name, slug\(unique\), description, iconUrl, parent\(self\-ref ObjectId, nullable for top\-level\), sortOrder, createdAt\.

__notifications__

\_id, user\(ref\), type\(REVIEW|REPLY|ADMIN|SYSTEM\), title, body, actionUrl, isRead\(default:false\), createdAt\. TTL index: auto\-delete after 90 days\.

__refresh\_tokens__

\_id, user\(ref\), tokenHash\(unique\), deviceInfo\{ua,ip,device\}, expiresAt\(TTL index\), revokedAt\(nullable\), createdAt\.

__audit\_logs__

\_id, user\(ref\), action\(CREATE|UPDATE|DELETE|LOGIN|LOGOUT|ROLE\_CHANGE\), entityType, entityId, oldValue\(Object\), newValue\(Object\), ipAddress, userAgent, createdAt\. TTL: 12 months\.

__activity\_logs__

\_id, user\(ref\), activityType\(VIEW\_PLANT|DETECTION|REVIEW|GARDEN\_UPDATE|BOOKMARK\), entityId, metadata\(Object\), createdAt\. Powers UserDashboard\.tsx activity feed\.

__system\_config__

Single document: \{ \_id: 'global', aiModelVersion, featuredPlantIds\[\], maintenanceMode, allowedDetectionsPerHour, featureFlags\{\} \}\. Cached in Redis\.

# __5\. Mongoose Schema Examples__

The following code snippets illustrate the TypeScript Mongoose schema implementations for the two most complex collections\. All schemas use \{ timestamps: true \} for automatic createdAt/updatedAt fields\.

## __5\.1 Plant Schema ΓÇö TypeScript \+ Mongoose__

// models/Plant\.ts

import mongoose, \{ Schema, Document \} from 'mongoose';

const GrowingConditionsSchema = new Schema\(\{

  soil: String, water: String, sunlight: String,

  climate: String, hardinessZone: String,

\}, \{ \_id: false \}\);

const ImageSchema = new Schema\(\{

  url: String, alt: String, isPrimary: Boolean,

  type: \{ type: String, enum: \['main','detail','infographic'\] \},

\}, \{ \_id: false \}\);

const PlantSchema = new Schema\(\{

  commonName:       \{ type: String, required: true, trim: true \},

  scientificName:   \{ type: String, required: true, unique: true \},

  slug:             \{ type: String, required: true, unique: true \},

  family:           \{ type: String, required: true \},

  medicinalUses:    \[\{ type: String \}\],

  toxicityLevel:    \{ type: String, enum: \['NONE','LOW','MODERATE','HIGH'\] \},

  growingConditions: GrowingConditionsSchema,

  images:           \[ImageSchema\],

  categories:       \[\{ type: Schema\.Types\.ObjectId, ref: 'Category' \}\],

  attributes:       \{ type: Map, of: Schema\.Types\.Mixed \},

  isPublished:      \{ type: Boolean, default: false \},

  createdBy:        \{ type: Schema\.Types\.ObjectId, ref: 'User' \},

  avgRating:        \{ type: Number, default: 0 \},

  viewCount:        \{ type: Number, default: 0 \},

\}, \{ timestamps: true \}\);

// Compound indexes

PlantSchema\.index\(\{ isPublished: 1, isFeatured: 1 \}\);

PlantSchema\.index\(\{ tags: 1 \}\);

## __5\.2 Detection TTL Index ΓÇö Auto\-Cleanup__

// models/Detection\.ts  ΓÇö TTL auto\-delete after 30 days

DetectionSchema\.index\(

  \{ expiresAt: 1 \},

  \{ expireAfterSeconds: 0 \}  // MongoDB deletes doc when expiresAt <= now\(\)

\);

// Set expiresAt when creating detection:

expiresAt: new Date\(Date\.now\(\) \+ 30 \* 24 \* 60 \* 60 \* 1000\)

# __6\. API Endpoints ΓÇö Full Specification__

All routes prefixed /api/v1\. Standard response: \{ success, data, error, meta? \}\. Pagination meta: \{ page, limit, total, totalPages \}\.

## __6\.1 Auth ΓÇö /auth__

__M__

__Endpoint__

__Auth__

__Description__

__POST__

/auth/register

None

Register email\+password\. Sends verification OTP\.

__POST__

/auth/login

None

Login\. Returns access\_token \+ sets httpOnly refresh cookie\.

__POST__

/auth/logout

Bearer

Revoke refresh token, clear cookie\.

__POST__

/auth/refresh

Cookie

Rotate refresh token, return new access\_token\.

__POST__

/auth/verify\-email

None

Verify OTP code from email\.

__POST__

/auth/forgot\-password

None

Send signed 30\-min reset link\.

__POST__

/auth/reset\-password

None

Set new password using valid reset token\.

__GET__

/auth/google

None

Initiate Google OAuth2 redirect\.

__GET__

/auth/google/callback

None

OAuth2 callback; create/update user, issue tokens\.

__POST__

/auth/2fa/setup

Bearer

Generate TOTP secret and QR code URI\.

__POST__

/auth/2fa/verify

Bearer

Confirm TOTP code and enable 2FA\.

__POST__

/auth/logout\-all

Bearer

Revoke all refresh\_tokens for user\. Force logout all devices\.

## __6\.2 Plants ΓÇö /plants__

__M__

__Endpoint__

__Auth__

__Description__

__GET__

/plants

None

List published plants\. Query: ?page ?limit ?search ?category ?family ?tags ?sort ?toxicity ?region

__GET__

/plants/featured

None

Curated featured plants for homepage\. Reads isFeatured:true\.

__GET__

/plants/search/autocomplete

None

Autocomplete suggestions\. Uses Atlas Search\. Returns top 5 matches\.

__GET__

/plants/:slug

None

Full plant detail\. Populates categories\. Increments viewCount \($inc\)\.

__GET__

/plants/:id/related

None

Related plants by shared categories or family\. Max 6 results\.

__POST__

/plants

BOTANIST\+

Create plant\. Accepts multipart/form\-data\. Auto\-generates slug\.

__PATCH__

/plants/:id

BOTANIST\+

Update plant fields\. BOTANIST can only update own plants\.

__POST__

/plants/:id/publish

ADMIN\+

Toggle isPublished flag\.

__POST__

/plants/:id/feature

ADMIN\+

Toggle isFeatured flag\.

__DELETE__

/plants/:id

ADMIN\+

Soft\-delete \(set isDeleted:true\)\. Does not remove document\.

__POST__

/plants/:id/images

BOTANIST\+

Upload additional images to S3; append to images array\.

__GET__

/plants/:id/reviews

None

Paginated reviews\. Sorted by createdAt desc\.

__POST__

/plants/:id/reviews

USER\+

Submit review\. One per user per plant\. Updates avgRating on plant doc\.

## __6\.3 Remedies ΓÇö /remedies__

__M__

__Endpoint__

__Auth__

__Description__

__GET__

/remedies

None

List remedies\. Filters: ?plant ?difficulty ?tags ?page ?search

__GET__

/remedies/:slug

None

Full remedy with \.populate\('plants'\) for plant names/images\.

__POST__

/remedies

BOTANIST\+

Create remedy with plants\[\] refs and embedded steps\.

__PATCH__

/remedies/:id

BOTANIST\+

Update remedy\. BOTANIST owns restriction applies\.

__DELETE__

/remedies/:id

ADMIN\+

Soft\-delete remedy\.

__POST__

/remedies/:id/publish

ADMIN\+

Publish / unpublish remedy\.

## __6\.4 AI Detection ΓÇö /ai__

__M__

__Endpoint__

__Auth__

__Description__

__POST__

/ai/detect

USER\+

Upload image\. Creates detection doc with status=PENDING\. Queues BullMQ job\. Returns \{ jobId \}\.

__GET__

/ai/detect/:jobId

USER\+

Poll detection status and results from MongoDB\.

__GET__

/ai/history

USER\+

Current user's detection history, paginated, newest first\.

__POST__

/ai/detect/:id/feedback

BOTANIST\+

Expert validation: embed feedback subdoc into detection document\.

__GET__

/ai/stats

ADMIN\+

Aggregated accuracy stats using MongoDB aggregation pipeline\.

## __6\.5 User & Garden ΓÇö /users/me & /garden__

__M__

__Endpoint__

__Auth__

__Description__

__GET__

/users/me

USER\+

Current user profile\.

__PATCH__

/users/me

USER\+

Update displayName, bio, avatarUrl\.

__POST__

/users/me/avatar

USER\+

Upload avatar to S3\. Update avatarUrl on user doc\.

__GET__

/users/me/bookmarks

USER\+

All user bookmarks\. Filter by ?entityType\.

__POST__

/users/me/bookmarks

USER\+

Create bookmark\. Enforces unique compound index\.

__DELETE__

/users/me/bookmarks/:id

USER\+

Remove bookmark by \_id\.

__GET__

/users/me/garden

USER\+

Get garden doc\. \.populate\('plants\.plant'\) for 3D scene data\.

__POST__

/users/me/garden/plants

USER\+

Add plant to garden\. $push to plants array\.

__PATCH__

/users/me/garden/plants/:pid

USER\+

Update plant position/rotation/scale\. Uses $ positional operator\.

__DELETE__

/users/me/garden/plants/:pid

USER\+

Remove plant from garden\. $pull from plants array\.

__GET__

/users/me/notifications

USER\+

Paginated notifications\. Filter ?isRead\.

__PATCH__

/users/me/notifications/read\-all

USER\+

Set all notifications isRead:true\. $set bulk op\.

__GET__

/users/me/activity

USER\+

Recent activity from activity\_logs collection\.

__DELETE__

/users/me

USER\+

GDPR: delete account \+ cascade delete all user data\.

## __6\.6 Admin ΓÇö /admin__

__M__

__Endpoint__

__Description__

__GET__

/admin/stats/overview

MongoDB aggregation: total users, plants, remedies, detections this month, new signups chart data\.

__GET__

/admin/stats/analytics

Time\-series with $group by date: views, registrations, AI usage\.

__GET__

/admin/users

Paginated user list\. Filter by role, isActive\. Search by email/displayName\.

__PATCH__

/admin/users/:id/role

Update user\.role\. Creates audit\_log entry\.

__PATCH__

/admin/users/:id/ban

Toggle isActive \+ set banReason\. Creates audit\_log entry\.

__GET__

/admin/plants/drafts

All plants where isPublished:false\.

__POST__

/admin/plants/:id/approve

Set isPublished:true\. Notify botanist author\.

__POST__

/admin/plants/:id/reject

Keep isPublished:false\. Store rejection feedback\. Notify author\.

__GET__

/admin/reviews/flagged

All reviews where isFlagged:true\.

__DELETE__

/admin/reviews/:id

Hard\-delete flagged review\. Recalculate plant avgRating\.

__GET__

/admin/audit\-logs

Paginated audit\_logs\. Filter by action, user, date range\.

__POST__

/admin/notifications/broadcast

Bulk insert notifications to many users\. Uses MongoDB insertMany\.

__GET__

/admin/system/health

MongoDB ping, Redis ping, S3 check, AI service check\.

__PATCH__

/admin/system/config

Update system\_config document\. Bust Redis cache\. SUPER\_ADMIN only\.

# __7\. MongoDB\-Specific Implementation Patterns__

## __7\.1 Atlas Search ΓÇö Full\-Text Search__

Use MongoDB Atlas Search \(Lucene\-based\) instead of a separate search service\. Create search indexes on plants and remedies collections via Atlas UI or CLI\.

// Atlas Search aggregation for plant search

Plant\.aggregate\(\[

  \{ $search: \{

      index: 'plants\_search',

      compound: \{

        must: \[\{ text: \{ query, path: \['commonName','medicinalUses'\], fuzzy: \{ maxEdits: 1 \} \} \}\],

        filter: \[\{ equals: \{ path: 'isPublished', value: true \} \}\]

      \}  \}  \},

  \{ $limit: 20 \},

  \{ $project: \{ score: \{ $meta: 'searchScore' \}, commonName:1, slug:1, images:1 \} \}

\]\);

## __7\.2 Aggregation Pipelines ΓÇö Admin Analytics__

- Dashboard stats: $group by \{ year, month \} on createdAt across users, plants, detections collections
- Top plants by views: \{ $sort: \{ viewCount: \-1 \}, $limit: 10 \} ΓÇö served cached in Redis \(5\-min TTL\)
- AI detection accuracy: $match feedback\.isCorrect, $group to get correct/total counts
- User activity timeline: $match user, $sort createdAt, $limit 20 from activity\_logs

## __7\.3 Atomic Operations ΓÇö Rating & Count Updates__

Never calculate avgRating with a separate query\. Use Mongoose post\-save hooks to atomically update the plant document:

// Review post\-save hook ΓÇö recalculate plant rating atomically

ReviewSchema\.post\('save', async function\(\) \{

  const stats = await Review\.aggregate\(\[

    \{ $match: \{ plant: this\.plant \} \},

    \{ $group: \{ \_id: null, avg: \{ $avg: '$rating' \}, count: \{ $sum: 1 \} \} \}

  \]\);

  await Plant\.findByIdAndUpdate\(this\.plant, \{

    avgRating: stats\[0\]?\.avg || 0,

    reviewCount: stats\[0\]?\.count || 0,

  \}\);

\}\);

## __7\.4 Change Streams ΓÇö Real\-Time Notifications__

Use MongoDB Change Streams to watch the detections collection and push results via Socket\.io when a detection document status changes to COMPLETE:

- Watch \{ operationType: 'update', 'updateDescription\.updatedFields\.status': 'COMPLETE' \}
- Emit Socket\.io event to specific user's room: socket\.to\(userId\)\.emit\('detection:complete', result\)
- Requires MongoDB Replica Set \(Atlas always runs as replica set\)

# __8\. AI Plant Detection Microservice__

## __8\.1 Microservice Specification__

__Python AI Microservice ΓÇö FastAPI \+ MongoDB Integration__

__Framework__

FastAPI \+ Uvicorn \(Python 3\.11\+\)

__ML Model__

EfficientNetV2 or PlantNet API \(external\)\. Weights stored in S3\.

__Image Processing__

OpenCV \+ Pillow: resize 224├ù224, normalize, EXIF strip

__Output__

Top\-5 predictions: \[\{ plantId, confidence, rank \}\]

__Communication__

Node\.js ΓåÆ POST /detect with \{ imageUrl, jobId, modelVersion \}

__Result Storage__

Python service writes results directly to MongoDB detections collection

__Callback__

After DB write, calls Node\.js webhook ΓåÆ triggers Change Stream ΓåÆ Socket\.io

__Model Updates__

Admin sets modelVersion in system\_config\. Python service reads on startup\.

## __8\.2 Detection Flow__

1. User uploads image ΓåÆ POST /api/v1/ai/detect \(multipart/form\-data\)
2. Node\.js validates file \(magic bytes, size Γëñ 10MB\), uploads to S3 temp path
3. Node\.js creates detection document: \{ status: 'PENDING', imageUrl, user, expiresAt \}
4. BullMQ job queued with \{ jobId, imageUrl, modelVersion \} ΓÇö returns 202 Accepted
5. BullMQ worker calls Python AI microservice: POST /detect with imageUrl
6. Python downloads from S3, preprocesses, runs inference, returns top\-5 predictions
7. Node\.js worker updates detection: \{ status: 'COMPLETE', predictions, topMatch, processingTimeMs \}
8. MongoDB Change Stream fires ΓåÆ Socket\.io pushes to user's browser room
9. Botanist reviews via /ai/detect/:id/feedback ΓåÆ embeds feedback subdoc

## __8\.3 Image Requirements__

- Accepted: JPEG, PNG, WEBP, HEIC \(auto\-convert to JPEG\)
- Maximum upload size: 10MB raw \(recommend client\-side compress to 2MB before upload\)
- Minimum resolution: 200├ù200px ΓÇö reject below this
- Rate limit: configurable in system\_config\.allowedDetectionsPerHour \(default: 10/user/hour\)
- EXIF stripped before storing in S3; original bytes never persisted

# __9\. Security Requirements__

## __9\.1 API Security__

- HTTPS enforced everywhere; HTTP ΓåÆ HTTPS redirect at load balancer
- CORS: whitelist only frontend origin\(s\) in production ΓÇö no wildcard \*
- Helmet\.js: CSP, HSTS, X\-Frame\-Options, X\-Content\-Type\-Options headers
- Rate limiting: 100 req/min/IP global, 5/min on /auth/\*, 10/hour/user on /ai/detect
- Request body size limit: 10MB for file uploads, 100KB for JSON bodies
- Zod validation on all POST/PATCH request bodies before hitting Mongoose
- File upload: validate MIME via magic bytes \(not extension\), ClamAV scan via S3 Lambda trigger

## __9\.2 MongoDB\-Specific Security__

- Never concatenate user input into MongoDB queries ΓÇö always use Mongoose/ObjectId typed params
- Sanitize inputs: strip $ and \. from keys to prevent NoSQL injection \(mongo\-sanitize package\)
- MongoDB Atlas: enable IP access list, VPC peering in production, disable public endpoint
- Least\-privilege DB user: application user has readWrite only on app database; no admin rights
- Encrypt totpSecret and OAuth accessTokens fields at application level \(AES\-256\) before saving
- Enable MongoDB Atlas Encryption at Rest \(available M10\+\)

## __9\.3 Data Privacy & GDPR__

- User emails never returned in public\-facing API responses \(plant authors shown as displayName only\)
- Detection images auto\-deleted after 30 days via MongoDB TTL index on expiresAt field
- Account deletion: DELETE /users/me cascades to garden, bookmarks, detections, reviews, activity\_logs
- Data export: GET /users/me/export ΓÇö aggregates all user documents into downloadable JSON

# __10\. Real\-Time Features & File Storage__

## __10\.1 WebSocket Events \(Socket\.io\)__

__Event__

__Trigger__

__Description__

__detection:complete__

Change Stream on detections

Push AI result to user when status ΓåÆ COMPLETE

__notification:new__

notification doc insert

Push new notification badge/count to user browser

__admin:alert__

Flagged review / error

Push alert to ADMIN\+ users' room

__garden:synced__

Garden doc update

Sync garden state across multiple open tabs

__plant:updated__

Plant doc change stream

Push update to users currently viewing that plant page

## __10\.2 S3 Bucket Structure__

__S3 Path__

__Contents & Notes__

__plants/\{plantId\}/images/__

Plant photos \(thumb 150├ù150, card 400├ù300, full 1200├ù900, all WebP\)

__plants/\{plantId\}/model\.glb__

3D GLTF model\. Public read via CDN\. Stored URL in plant\.model3dUrl

__users/\{userId\}/avatar/__

Profile pictures\. Auto\-resized to 256├ù256 WebP on upload\.

__ai/uploads/\{jobId\}/__

Temp AI uploads\. Private\. S3 lifecycle: auto\-delete after 7 days\.

__tours/\{tourId\}/media/__

Tour images, 360 photos, video clips\. Public read via CDN\.

__remedies/\{remedyId\}/images/__

Remedy preparation images\. Public read\.

__exports/\{date\}/reports/__

Admin CSV/JSON exports\. Private\. Pre\-signed URL, 1hr expiry\.

## __10\.3 Image Processing Pipeline__

- On upload: validate magic bytes \(not extension\), reject if not JPEG/PNG/WEBP/HEIC
- Use sharp \(Node\.js\) to generate 3 size variants \+ convert all to WebP
- Generate base64 LQIP \(Low Quality Image Placeholder\) for progressive loading in React
- Store \{ url, thumbnailUrl, cardUrl, fullUrl, lqip, width, height, alt \} in images array
- CDN via CloudFront / Cloudflare in front of S3 ΓÇö never serve S3 URLs directly

# __11\. DevOps, Infrastructure & Development Timeline__

## __11\.1 Environment Stack__

__Env__

__MongoDB__

__Infrastructure__

__Local Dev__

Atlas M0 Free / mongodb\-memory\-server \(tests\)

Docker Compose: Node\.js \+ Redis \+ Python AI service

__Staging__

Atlas M10 Dedicated \(replica set\)

AWS ECS Fargate, same config as prod

__Production__

Atlas M20\+ with backups \+ Atlas Search enabled

AWS ECS \+ ElastiCache Redis \+ CloudFront CDN

## __11\.2 Key Environment Variables__

__Variable__

__Description__

__MONGODB\_URI__

MongoDB Atlas connection string \(includes auth \+ cluster URL\)

MONGODB\_DB\_NAME

Database name e\.g\. herbal\_garden\_prod

__REDIS\_URL__

Redis connection URL for caching and BullMQ

JWT\_PRIVATE\_KEY

RS256 private key PEM for signing JWTs

__JWT\_PUBLIC\_KEY__

RS256 public key PEM for verifying JWTs

AWS\_S3\_BUCKET

S3 bucket name for media storage

__AWS\_REGION__

AWS region for S3 and CloudFront

GOOGLE\_CLIENT\_ID

Google OAuth2 Client ID

__GOOGLE\_CLIENT\_SECRET__

Google OAuth2 Client Secret

AI\_SERVICE\_URL

Internal URL of Python FastAPI microservice

__ENCRYPTION\_KEY__

AES\-256 key for TOTP secrets and OAuth token encryption

SMTP\_HOST/USER/PASS

Email provider credentials \(SMTP or AWS SES DSN\)

__CLIENT\_URL__

Frontend URL for CORS whitelist and OAuth callback base

## __11\.3 Development Timeline ΓÇö 15 Weeks__

__Phase__

__Duration__

__Deliverables__

__1__

Week 1ΓÇô2

Project scaffold: Express \+ TypeScript \+ Mongoose \+ Docker Compose\. MongoDB Atlas setup, all collection schemas \+ indexes created\. Base middleware \(Helmet, CORS, rate limit\)\.

__2__

Week 3ΓÇô4

Auth system: register, login, JWT RS256, refresh token rotation, email verification, Google OAuth2, bcrypt, RBAC middleware, 2FA TOTP\.

__3__

Week 5ΓÇô6

Plants & Remedies APIs: full CRUD, S3 image upload \+ sharp processing, Atlas Search indexes, categories, tags, pagination, review system \+ rating hook\.

__4__

Week 7

User features: dashboard, bookmarks, virtual garden CRUD \($push/$pull/$set on garden\.plants\), notifications, activity\_logs\.

__5__

Week 8ΓÇô9

AI microservice: Python FastAPI \+ BullMQ job queue, ML model integration, MongoDB TTL index, Change Streams \+ Socket\.io for real\-time result push\.

__6__

Week 10

Admin Panel APIs: MongoDB aggregation pipelines for analytics, user management, content moderation, audit\_logs, system\_config\.

__7__

Week 11

Tours & CMS: tour CRUD with embedded stops, dynamic homepage content API, featured plant management\.

__8__

Week 12ΓÇô13

Testing: Jest unit tests \+ Supertest integration tests using mongodb\-memory\-server\. Security audit: NoSQL injection checks, mongo\-sanitize, auth bypass tests\.

__9__

Week 14

Performance: slow query log analysis, add missing indexes, Redis caching for hot endpoints \(plant list, featured, stats\)\. Swagger docs\.

__10__

Week 15

Production deployment: Atlas M20, CI/CD pipeline, CloudFront CDN, monitoring setup, frontend integration handoff\.

## __11\.4 Frontend Integration Priority \(Quickest Unblock Order\)__

1. Auth APIs ΓåÆ unblocks all protected pages immediately
2. GET /plants \+ GET /plants/:slug ΓåÆ unblocks PlantLibrary\.tsx \+ PlantDetail\.tsx
3. GET /remedies \+ GET /remedies/:slug ΓåÆ unblocks RemediesPage\.tsx
4. GET /users/me \+ garden endpoints ΓåÆ unblocks UserDashboard\.tsx \+ VirtualGarden3D\.tsx
5. AI detection endpoints ΓåÆ unblocks AIPlantDetection\.tsx
6. Admin endpoints ΓåÆ unblocks AdminPanel\.tsx
7. Tour endpoints ΓåÆ unblocks VirtualTour\.tsx

# __12\. Appendix__

## __12\.1 Response Envelope Standard__

// Success

\{ "success": true, "data": \{ \.\.\. \}, "meta": \{ "page": 1, "limit": 20, "total": 350, "totalPages": 18 \} \}

// Error

\{ "success": false, "error": \{ "code": "VALIDATION\_ERROR", "message": "\.\.\.", "details": \[\.\.\.\] \} \}

## __12\.2 npm Package List ΓÇö Node\.js Backend__

__Package__

__Version__

__Purpose__

__mongoose__

8\.x

MongoDB ODM ΓÇö schemas, models, hooks, population

express

4\.x

HTTP server framework

__express\-async\-errors__

latest

Auto\-catch async errors without try/catch everywhere

passport \+ passport\-jwt

latest

JWT auth middleware strategy

__passport\-google\-oauth20__

latest

Google OAuth2 strategy

jsonwebtoken

9\.x

JWT sign and verify with RS256

__bcryptjs__

2\.x

Password hashing

otplib

12\.x

TOTP 2FA generation \+ verification

__zod__

3\.x

Request body schema validation \+ TypeScript inference

mongo\-sanitize

1\.x

Strip $ and \. from inputs ΓÇö NoSQL injection prevention

__@aws\-sdk/client\-s3__

3\.x

S3 upload, presigned URLs, delete

multer \+ multer\-s3

latest

Multipart file upload handling, stream to S3

__sharp__

0\.33\.x

Image resize \+ WebP conversion \+ LQIP generation

bullmq

5\.x

Redis\-backed job queue for AI detection \+ email jobs

__socket\.io__

4\.x

WebSocket real\-time events

ioredis

5\.x

Redis client ΓÇö caching, sessions, BullMQ transport

__nodemailer__

6\.x

Email sending \(OTP, password reset\)

helmet

7\.x

Security HTTP headers

__express\-rate\-limit__

7\.x

Request rate limiting

swagger\-ui\-express

5\.x

API docs UI at /api/docs

__winston__

3\.x

Structured JSON logging

jest \+ supertest

latest

Unit and integration testing

__mongodb\-memory\-server__

10\.x

In\-memory MongoDB for isolated fast tests

## __12\.3 HTTP Status Codes__

__Code__

__Name__

__When to Use__

__200__

OK

Successful GET, PATCH, DELETE

__201__

Created

Successful POST that created a document

__202__

Accepted

AI detection queued ΓÇö processing async

__400__

Bad Request

Zod validation error or malformed input

__401__

Unauthorized

Missing or invalid JWT

__403__

Forbidden

Valid JWT but insufficient role

404

Not Found

MongoDB document not found

__409__

Conflict

Duplicate key ΓÇö email or slug already exists in MongoDB

__422__

Unprocessable

Semantic error ΓÇö e\.g\. invalid ObjectId reference

__429__

Too Many Requests

Rate limit exceeded \(Redis counter\)

__500__

Server Error

Unexpected error ΓÇö log full error, return generic message to client

*End of Document ΓÇö Virtual Herbal Garden Backend PRD v2\.0 ΓÇö MongoDB Edition*

Generated March 2026  |  For internal development use only

