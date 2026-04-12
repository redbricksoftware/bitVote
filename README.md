# BitVote API

NestJS backend for a pairwise comparison ranking system. Users create polls with items and ranking dimensions, voters compare items in pairs, and the system aggregates results into statistical rankings using a transitive closure algorithm.

## Tech Stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL + TypeORM
- **Auth:** JWT (access + refresh tokens), Passport.js, Argon2 password hashing
- **Docs:** Swagger/OpenAPI (auto-generated in local mode)

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+

### Install

```bash
npm install
```

### Environment

Create a `local.dev.env` file (one is included with dev defaults):

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=mysecretpassword
DB_DATABASE=bitvote

JWT_SECRET=<random-string>
JWT_REFRESH_SECRET=<random-string>
ARGON2_SECRET=<random-string>

APP_PORT=3000
```

Set `RUN_LEVEL=LOCAL` (default in dev scripts) to enable Swagger docs and auto-schema sync. Omit or set to any other value for production (uses migrations instead).

### Database

```bash
createdb bitvote
```

In local mode, TypeORM auto-syncs the schema. For production, use migrations:

```bash
npm run migration:run
```

### Run

```bash
npm run start:dev       # Watch mode (local)
npm run start:debug     # Debug mode (local)
npm run build           # Compile to dist/
npm run start:prod      # Run compiled build
```

Server starts on `http://localhost:3000`. Swagger docs available at `http://localhost:3000/api-docs` in local mode.

### Test

```bash
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:cov        # Coverage report
```

### Migrations

```bash
npm run migration:generate -d src/data-source.ts   # Generate from entity changes
npm run migration:run                               # Apply pending
npm run migration:revert                            # Rollback last
```

## API Endpoints

All endpoints are versioned under `/v1/`. Protected routes require `Authorization: Bearer <accessToken>`.

### Auth (`/v1/auth`)

| Method | Path              | Auth     | Description              |
| ------ | ----------------- | -------- | ------------------------ |
| POST   | `/auth/register`  | None     | Register a new user      |
| POST   | `/auth/login`     | None     | Login, get tokens        |
| POST   | `/auth/refresh`   | Refresh  | Refresh access token     |
| POST   | `/auth/logout`    | Access   | Logout, clear refresh    |

**Register/Login body:** `{ email, password, displayName }` (register) or `{ email, password }` (login)
**Returns:** `{ accessToken, refreshToken }`

### BitVotes (`/v1/bitvotes`)

All require access token. Only the owner can modify their bitvotes.

| Method | Path                                  | Description                       |
| ------ | ------------------------------------- | --------------------------------- |
| POST   | `/bitvotes`                           | Create bitvote                    |
| GET    | `/bitvotes`                           | List user's bitvotes              |
| GET    | `/bitvotes/:id`                       | Get bitvote with items/dimensions |
| PATCH  | `/bitvotes/:id`                       | Update name, description, voting  |
| DELETE | `/bitvotes/:id`                       | Delete bitvote (cascades)         |
| POST   | `/bitvotes/:id/items`                 | Add item                          |
| PATCH  | `/bitvotes/:id/items/:itemId`         | Update item                       |
| DELETE | `/bitvotes/:id/items/:itemId`         | Remove item                       |
| POST   | `/bitvotes/:id/dimensions`            | Add dimension                     |
| PATCH  | `/bitvotes/:id/dimensions/:dimId`     | Update dimension                  |
| DELETE | `/bitvotes/:id/dimensions/:dimId`     | Remove dimension                  |

### Voting (`/v1/voting`)

| Method | Path                           | Auth   | Description                        |
| ------ | ------------------------------ | ------ | ---------------------------------- |
| GET    | `/voting/:bitvoteId/question`  | Access | Get next pairwise comparison       |
| POST   | `/voting/:bitvoteId/answer`    | Access | Submit vote (`A_BETTER`/`B_BETTER`) |
| GET    | `/voting/:bitvoteId/progress`  | Access | Completion progress per dimension  |
| GET    | `/voting/:bitvoteId/results`   | None   | Aggregated rankings                |

**Query params:** `/question` accepts optional `dimensionId` to target a specific dimension.

## Database Schema

```
users
  userId (UUID PK), email (unique), passwordHash, displayName,
  refreshToken, createdAt, updatedAt

bitvotes
  bitvoteId (UUID PK), ownerId (FK users), name, description,
  votingOpen, createdAt, updatedAt

items
  itemId (UUID PK), bitvoteId (FK, CASCADE), name, description, sortOrder

dimensions
  dimensionId (UUID PK), bitvoteId (FK, CASCADE), name, questionTemplate

comparisons
  comparisonId (UUID PK), userId (FK), bitvoteId (FK, CASCADE),
  dimensionId (FK, CASCADE), itemAId (FK, CASCADE), itemBId (FK, CASCADE),
  result (A_BETTER|B_BETTER), inferred (bool), createdAt
  UNIQUE (userId, dimensionId, itemAId, itemBId)

user_rankings
  userRankingId (UUID PK), userId (FK), bitvoteId (FK, CASCADE),
  dimensionId (FK, CASCADE), itemId (FK, CASCADE),
  rank, complete (bool), updatedAt
  UNIQUE (userId, dimensionId, itemId)
```

## Architecture

```
src/
├── auth/           # JWT auth, Passport strategies, guards, user entity
├── bitvote/        # Bitvote/Item/Dimension CRUD
├── voting/         # Voting flow, ranking computation
├── shared/config/  # Environment config & validation
├── app.module.ts   # Root module
├── main.ts         # Bootstrap with Helmet, CORS, Swagger
└── data-source.ts  # TypeORM CLI data source
```

### Key Design Decisions

- **Pairwise comparisons** reduce cognitive load vs. direct ranking and produce more consistent preference data.
- **Transitive closure** infers missing comparisons (A > B, B > C implies A > C), stored with `inferred=true`. Reduces the number of votes needed.
- **Dimensions** allow ranking items on multiple criteria independently (e.g., "performance" vs. "aesthetics").
- **Ranking computation** counts wins per item per dimension, assigns rank positions, then aggregates across voters as mean rank + standard deviation.
- **Question selection** randomly picks from unanswered pairs for variety.
