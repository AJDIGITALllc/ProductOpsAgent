# ProductOpsAgent

A production-ready TypeScript monorepo MVP for managing Whop products through a chat interface with a two-phase commit workflow: **PLAN → APPROVE → EXECUTE**.

## Overview

ProductOpsAgent is a Whop admin application that enables administrators to create and update Whop products through natural language chat. The system implements strong guardrails, idempotency, and full audit logging.

### Key Features

- ✅ **Two-phase commit**: PLAN → APPROVE → EXECUTE
- ✅ **Whitelisted actions** with Zod validation
- ✅ **Idempotent execution** prevents duplicates
- ✅ **Full audit log** of all operations
- ✅ **Defaults to draft** (publish must be explicit)
- ✅ **Stub mode** when WHOP_API_KEY is missing
- ✅ **Clean UI** built with Next.js and Tailwind

## Repository Structure

```
ProductOpsAgent/
├── apps/
│   ├── api/          # Node.js API server (Express + Prisma)
│   └── web/          # Next.js admin UI (App Router)
├── packages/
│   ├── shared/       # Shared types, validators (Zod)
│   └── whop/         # Whop API client wrapper
├── package.json      # Root workspace config
└── README.md         # This file
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ProductOpsAgent

# Install dependencies for all workspaces
npm install
```

### Configuration

1. **API Server (.env)**

Create `apps/api/.env` based on `.env.example`:

```bash
cd apps/api
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="file:./dev.db"
WHOP_API_KEY="your_whop_api_key_here"  # Optional - stub mode without it
APP_SECRET="your_secret_key_for_jwt_at_least_32_chars_long"
JWT_SECRET="your_jwt_secret_key_at_least_32_chars_long"
PORT=3001
NODE_ENV=development
```

2. **Web App (.env.local)**

Create `apps/web/.env.local` based on `.env.example`:

```bash
cd apps/web
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NODE_ENV=development
```

### Database Setup

```bash
# Generate Prisma client
cd apps/api
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with templates
npm run db:seed
```

### Running the Application

**Option 1: Run both services concurrently (recommended)**

```bash
# From root directory
npm run dev
```

**Option 2: Run services separately**

```bash
# Terminal 1 - API Server
npm run dev:api

# Terminal 2 - Web App
npm run dev:web
```

The application will be available at:
- **Web UI**: http://localhost:3000
- **API Server**: http://localhost:3001

## Usage

### 1. Dashboard (`/dashboard`)
View recent runs and their status

### 2. Builder (`/builder`)
Chat interface to create products:

**Example prompts:**
- "Create a product called 'Premium Consulting', price it at $299 monthly, make it recurring, and add FAQs"
- "Create a product called 'Personal Brand Package', price it at $1499"
- "Create 'AI Setup Service', price $4999, add description: Expert AI implementation"

**Workflow:**
1. Enter prompt
2. Review generated action plan
3. Click "Approve & Execute"
4. Watch execution timeline

### 3. Templates (`/templates`)
Browse and use pre-built templates:
- Consulting Retainer (monthly)
- Personal Brand Package (one-time)
- AI Setup Service (one-time)

### 4. Products (`/products`)
View and manage all created products

### 5. Settings (`/settings`)
Configure defaults and access controls

## Action Whitelist

The system supports these whitelisted actions:

1. **whop.product.create** - Create a new product (defaults to draft)
2. **whop.product.update_name** - Update product name
3. **whop.product.set_pricing** - Set pricing (one-time, monthly, yearly)
4. **whop.product.set_description** - Set description (block model)
5. **whop.product.set_faqs** - Add FAQ entries
6. **whop.product.set_payment_options** - Configure payment options
7. **whop.product.publish** - Publish product (only if explicitly requested)
8. **whop.product.get** - Read product details (read-only)

## Guardrails

- **Price validation**: Must be > 0
- **Currency validation**: Only USD, EUR, GBP supported
- **Interval validation**: one_time, monthly, yearly
- **Idempotency**: Prevents duplicate actions on rerun
- **Default to draft**: Products are draft unless explicitly published
- **Approval required**: All plans require approval token to execute

## Development

### Testing

```bash
# Run tests for all packages
npm test

# Test specific package
npm test --workspace=packages/shared
npm test --workspace=packages/whop
```

### Building

```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build:api
npm run build:web
```

### Type Checking

```bash
# Type check all workspaces
npm run typecheck
```

### Database Management

```bash
# Generate Prisma client
cd apps/api
npm run db:generate

# Create migration
npm run db:migrate

# Apply migrations (production)
npm run db:migrate:prod

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

## Architecture

### Two-Phase Commit Flow

1. **PLAN Phase** (`POST /api/plan`)
   - User submits natural language prompt
   - System generates deterministic action plan (JSON)
   - Plan is validated with Zod schemas
   - No external changes made
   - Returns: runId, actionPlan, approvalToken

2. **APPROVE Phase** (UI)
   - User reviews action plan in UI
   - Can see exactly what will happen
   - Clicks "Approve & Execute" button

3. **EXECUTE Phase** (`POST /api/execute`)
   - Requires valid approvalToken
   - Executes actions in order
   - Each action is idempotent
   - Results logged to database
   - Returns: execution results and final status

### Data Flow

```
User → Web UI → API Server → Planner Service → Action Plan
                    ↓
User Reviews Plan → Approve → Executor Service → Whop API
                    ↓
Results → Database → Audit Log
```

## TODO Markers

The codebase includes TODO comments marking areas requiring Whop API specifics:

**packages/whop/src/client.ts:**
- Whop API endpoint URLs
- Request/response payload structures
- Authentication headers format
- Payment options support confirmation

Search for `TODO:` in the codebase to find all markers.

## Stub Mode

When `WHOP_API_KEY` is not configured, the system runs in **stub mode**:
- All Whop API calls return simulated responses
- Idempotency still works correctly
- Perfect for development and testing
- Console logs clearly indicate stub mode

## Environment Variables Reference

### API Server (`apps/api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | SQLite database path or connection string |
| WHOP_API_KEY | No | Whop API key (stub mode if missing) |
| APP_SECRET | Yes | Secret for JWT signing |
| JWT_SECRET | Yes | Alternative JWT secret |
| PORT | No | Server port (default: 3001) |
| NODE_ENV | No | Environment (development/production) |

### Web App (`apps/web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_API_URL | Yes | API server URL |
| NODE_ENV | No | Environment (development/production) |

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001 (API)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (Web)
lsof -ti:3000 | xargs kill -9
```

### Database Issues

```bash
# Reset database
cd apps/api
rm -f prisma/dev.db
npm run db:migrate
npm run db:seed
```

### Type Errors

```bash
# Rebuild all packages
npm run build

# Regenerate Prisma client
cd apps/api
npm run db:generate
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT
