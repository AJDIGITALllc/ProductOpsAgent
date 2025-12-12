# ProductOpsAgent

A chat UI where the user says: "Create a new product called X, price it at Y, make it recurring, add FAQs," and an agent executes those actions through the Whop API with guardrails, logging, and rollback.

## Features

- **Persistent Storage**: All plans, actions, executions, and audit logs stored in database with Prisma
- **Idempotency**: Exactly-once execution semantics using durable idempotency keys
- **Whop Integration**: Real Whop API adapter with automatic stub fallback
- **Authentication**: JWT-based auth with server-side role derivation
- **Webhooks**: Durable webhook delivery with retries and dead-letter handling
- **Rate Limiting**: Per-user rate limiting with IP fallback
- **AI Planning**: OpenAI integration for natural language to action plan conversion
- **Admin UI**: React-based UI showing execution state, plan JSON, and webhook status

## Architecture

- **packages/database**: Prisma schema and migrations
- **packages/server**: Express API server with all business logic
- **packages/admin-ui**: React admin interface

## Setup

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# Start the development server
npm run dev

# In another terminal, start the admin UI
npm run dev:ui
```

### Environment Variables

Copy `.env.example` to `.env` in packages/server and configure:

```bash
# Required
JWT_SECRET=your-secret-key-change-in-production

# Optional - leave empty for stub mode
WHOP_API_KEY=your-whop-api-key

# Optional - leave empty for rules-only planner
OPENAI_API_KEY=your-openai-api-key
PLANNER_MODE=RULES  # or OPENAI

# Optional - webhook delivery
WEBHOOK_URL=http://your-webhook-endpoint
```

### User Allowlist

Edit USER_ALLOWLIST in `.env` to configure authorized users and their roles:

```json
[
  {"sub":"admin","role":"Owner"},
  {"sub":"user1","role":"User"}
]
```

## API Endpoints

### Health
- `GET /health` - Health check with mode indicator (REAL/STUB)

### Plans
- `POST /plans` - Create a new action plan (requires auth)
- `GET /plans/:planId` - Get plan details (requires auth)
- `POST /plans/:planId/approve` - Approve/reject a plan (requires auth)
- `POST /plans/:planId/publish` - Publish a plan (Owner only)

### Execution
- `POST /execute/:planId` - Execute an approved plan (requires auth)

### Admin
- `GET /admin/webhooks/:planId` - Get webhook delivery status (Owner only)
- `GET /admin/webhooks` - Get all webhook deliveries (Owner only)
- `GET /admin/audit` - Get audit logs (Owner only)

## Authentication

Generate a JWT token for testing:

```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  {
    sub: 'admin',
    iss: 'product-ops-agent',
    aud: 'product-ops-agent-api',
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  },
  'dev-secret-key-change-in-production'
);
console.log(token);
```

Include in requests as: `Authorization: Bearer <token>`

## Action Types (Whitelisted DSL)

- `CREATE_PRODUCT`: Create a new product
  - Required: name, price, recurring
- `UPDATE_PRODUCT`: Update a product
  - Required: productId
  - Optional: name, price, recurring
- `DELETE_PRODUCT`: Delete a product
  - Required: productId
- `ADD_FAQ`: Add a FAQ
  - Required: question, answer
- `UPDATE_FAQ`: Update a FAQ
  - Required: faqId
  - Optional: question, answer
- `DELETE_FAQ`: Delete a FAQ
  - Required: faqId

## Example Action Plan

```json
{
  "planId": "plan_123",
  "actions": [
    {
      "type": "CREATE_PRODUCT",
      "payload": {
        "name": "Premium Product",
        "price": 99.99,
        "recurring": true
      }
    },
    {
      "type": "ADD_FAQ",
      "payload": {
        "question": "What is this?",
        "answer": "This is a premium product."
      }
    }
  ],
  "description": "Create premium product with FAQ"
}
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage
```

## Database Management

```bash
# Open Prisma Studio
npm run db:studio

# Create a new migration
npm run db:migrate

# Reset database (development only)
cd packages/database && npx prisma migrate reset
```

## Admin UI

Access at http://localhost:3000

Features:
- View REAL/STUB mode banner
- Load and view plan JSON
- See execution state with failed step index
- View webhook delivery status
- Copy JSON to clipboard

## Production Deployment

1. Set secure JWT_SECRET
2. Configure WHOP_API_KEY for real API
3. Set up production database (PostgreSQL recommended)
4. Configure webhook URL
5. Set up Redis for rate limiting (optional, DB works for MVP)
6. Build and deploy:

```bash
npm run build
npm run start --workspace=packages/server
```

## License

MIT
