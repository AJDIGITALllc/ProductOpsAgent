# ProductOpsAgent

A TypeScript monorepo MVP for building Whop products through a chat-based interface with two-phase commit workflow: **PLAN → APPROVE → EXECUTE**.

## Overview

ProductOpsAgent is a secure admin application that enables users to create and manage Whop products through natural language chat commands. The system includes:

- **Chat-based Builder UI**: Next.js admin interface with intuitive chat commands
- **Two-Phase Commit**: Safe execution with plan review and approval before execution
- **Secure API**: Express server with action whitelist, validation, and audit logging
- **Template System**: Pre-configured product templates for quick setup
- **Stub Mode**: Works without Whop API key for development and testing

## Architecture

```
ProductOpsAgent/
├── packages/
│   ├── database/          # Prisma + SQLite database layer
│   ├── server/            # Express API with Whop integration
│   └── admin-ui/          # Next.js chat-based admin interface
```

### Key Features

- ✅ **Action Whitelist**: Only approved actions can be executed
- ✅ **Validation**: Zod schemas validate all inputs
- ✅ **Idempotency**: Prevents duplicate API calls
- ✅ **Audit Logging**: Complete history of all operations
- ✅ **Two-Phase Commit**: Review plans before execution
- ✅ **Template System**: 3 pre-seeded product templates
- ✅ **Stub Mode**: Development without real API keys

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ProductOpsAgent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create `.env` files in each package from the examples:

   ```bash
   # Database
   cp packages/database/.env.example packages/database/.env
   
   # Server
   cp packages/server/.env.example packages/server/.env
   
   # Admin UI
   cp packages/admin-ui/.env.example packages/admin-ui/.env
   ```

   **Optional**: Add your Whop API key to `packages/server/.env`:
   ```
   WHOP_API_KEY=your_api_key_here
   ```
   
   *Note: If no API key is provided, the system runs in stub mode with simulated API calls.*

4. **Initialize the database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start the development servers**

   Open three terminal windows:

   **Terminal 1 - API Server:**
   ```bash
   cd packages/server
   npm run dev
   ```

   **Terminal 2 - Admin UI:**
   ```bash
   cd packages/admin-ui
   npm run dev
   ```

6. **Open the application**
   
   Navigate to: http://localhost:3000

## Usage

### Chat Commands

The chat builder understands natural language. Try these examples:

- `Create a product called "Premium Course" and price it at $99`
- `Make a monthly subscription for $29`
- `Create a product called "VIP Access", price it at $49 monthly, and add an FAQ about cancellation`
- `Use the Digital Course template and name it "Advanced TypeScript"`

### Workflow

1. **PLAN**: Type your request in the chat builder
2. **APPROVE**: Review the generated action plan
3. **EXECUTE**: Approve to execute, or cancel to go back

### Available Actions

- `create_draft`: Create a new draft product
- `set_pricing`: Configure one-time or recurring pricing
- `add_description_block`: Add content sections
- `add_faq`: Add FAQ items
- `set_payment_options`: Configure payment methods
- `publish`: Publish product to Whop (explicit only)

## Project Structure

### Database Package (`packages/database`)

Prisma-based data layer with SQLite:

- **Models**: Product, Plan, AuditLog, ProductTemplate, IdempotencyKey
- **Seed Data**: 3 product templates (Digital Course, Monthly Subscription, Premium Bundle)
- **Scripts**: `db:generate`, `db:push`, `db:seed`, `db:studio`

### Server Package (`packages/server`)

Express API server:

- **Routes**: `/api/plans`, `/api/products`, `/api/templates`, `/api/audit`
- **Services**: 
  - `WhopService`: API wrapper with stub support
  - `ActionService`: Action validation and execution
  - `PlanService`: Two-phase commit implementation
  - `AuditService`: Logging all operations
  - `IdempotencyService`: Preventing duplicate calls

### Admin UI Package (`packages/admin-ui`)

Next.js 14 application:

- **Chat Builder**: Natural language interface for product creation
- **Plan Approval**: Review and approve/reject action plans
- **Product List**: View and manage created products
- **Template Selector**: Quick start with pre-configured templates

## API Reference

### Plans API

```typescript
POST   /api/plans              Create a new plan
POST   /api/plans/:id/approve  Approve a plan
POST   /api/plans/:id/execute  Execute an approved plan
POST   /api/plans/:id/cancel   Cancel a pending plan
GET    /api/plans/:id          Get plan details
GET    /api/plans              List all plans
```

### Products API

```typescript
GET    /api/products           List all products
GET    /api/products/:id       Get product details
DELETE /api/products/:id       Delete a draft product
```

### Templates API

```typescript
GET    /api/templates          List all templates
GET    /api/templates/:id      Get template details
```

### Audit API

```typescript
GET    /api/audit              Get all audit logs
GET    /api/audit/product/:id  Get logs for a product
GET    /api/audit/plan/:id     Get logs for a plan
```

## Environment Variables

### Database (`packages/database/.env`)
```
DATABASE_URL="file:./dev.db"
```

### Server (`packages/server/.env`)
```
PORT=3001
DATABASE_URL="file:../database/prisma/dev.db"
WHOP_API_KEY=""                              # Optional - runs in stub mode if missing
WHOP_API_URL="https://api.whop.com/v1"      # Whop API endpoint
NODE_ENV="development"
```

### Admin UI (`packages/admin-ui/.env`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Development

### Build all packages
```bash
npm run build
```

### Run linters
```bash
npm run lint
```

### Type checking
```bash
npm run typecheck
```

### Format code
```bash
npm run format
```

### Database management
```bash
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema changes
npm run db:seed      # Seed templates
```

## Security Features

1. **Action Whitelist**: Only predefined actions can be executed
2. **Validation**: Zod schemas validate all API inputs
3. **Two-Phase Commit**: Explicit approval required before execution
4. **Audit Logging**: Every operation is logged with user, timestamp, and details
5. **Idempotency**: Duplicate requests are safely handled
6. **Explicit Publish**: Products must be explicitly published (no auto-publish)

## Stub Mode

When running without a Whop API key, the system operates in stub mode:

- All Whop API calls are simulated
- Stub responses are logged to console
- Full workflow testing without real API
- Perfect for development and demos

Look for `⚠️ Running in STUB mode` in the server logs.

## Troubleshooting

### Database issues
```bash
# Reset database
rm packages/database/prisma/dev.db
npm run db:push
npm run db:seed
```

### Port conflicts
Change ports in `.env` files if 3000 or 3001 are in use.

### Dependencies not found
```bash
# Clean install
rm -rf node_modules packages/*/node_modules
npm install
```

## License

MIT
