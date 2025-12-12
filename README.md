# ProductOpsAgent

A chat UI where the user says: "Create a new product called X, price it at Y, make it recurring, add FAQs," and an agent executes those actions through the Whop API with guardrails, logging, and rollback.

## Features

### ✅ Task 1: Auth + Role Gates
- JWT-based authentication middleware
- Protected plan/execute endpoints (authentication required)
- Owner role required for publish actions
- Unauthorized access rejection with clear error messages

### ✅ Task 2: Server-Side Idempotency
- Persistent idempotency for action execution
- Key format: `planId:actionIndex:actionType:payloadHash`
- Prevents duplicate execution across retries or double approvals
- Integrated into execution pipeline

### ✅ Task 3: Deterministic PLAN Generator
- Pure function: same input always yields identical plan JSON
- Validations enforced:
  - Price must be > 0
  - Supported currencies: USD, EUR, GBP
  - Supported intervals: monthly, yearly, weekly, one_time
- Publish only included when explicitly requested
- FAQs sorted alphabetically for determinism

### ✅ Task 4: Failure Semantics
- Immediate halt on any action failure
- Plan marked as FAILED with:
  - Failed step index
  - Error message
  - Completed steps list
- Partial execution state persisted
- API returns partial results
- No rollback logic (as specified)

### ✅ Task 5: UI Operational Clarity
- STUB MODE banner when WHOP_API_KEY missing
- Draft vs Publish toggle (default: Draft)
- "Copy Plan JSON" button
- "Copy Execution JSON" button
- Clear failure display with stop-at-step details

### ✅ Task 6: Webhook Events
- POST webhooks on:
  - `plan.created`
  - `plan.approved`
  - `plan.executed`
  - `plan.failed`
- Webhook URL from env var
- Fire-and-forget (no retries in MVP)
- Failures logged

### ✅ Task 7: Rate Limiting + Logging
- Rate limiting per user/IP (configurable)
- Structured request logs including:
  - User ID and role
  - Plan ID
  - Action count
  - Duration
  - Status

### ✅ Task 8: Production Readiness
- Server-only secrets (JWT_SECRET, WHOP_API_KEY)
- Environment validation on boot
- Clear error messages throughout
- README with local + prod setup

## Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/AJDIGITALllc/ProductOpsAgent.git
cd ProductOpsAgent
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure server environment**
```bash
cd packages/server
cp .env.example .env
```

Edit `.env` and set required variables:
```bash
# Required
JWT_SECRET=your-secret-key-here-change-me
PORT=3001

# Optional - omit for stub mode
# WHOP_API_KEY=your-whop-api-key

# Optional - for webhook events
# WEBHOOK_URL=https://your-webhook-endpoint.com/webhooks

# Rate limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

4. **Start the server**
```bash
cd packages/server
npm run dev
```

Server will start on http://localhost:3001

5. **Start the UI** (in a new terminal)
```bash
cd packages/ui
npm run dev
```

UI will start on http://localhost:3000

### Environment Variables

#### Required
- `JWT_SECRET` - Secret key for JWT token signing (generate a secure random string)
- `PORT` - Server port (default: 3001)

#### Optional
- `WHOP_API_KEY` - Whop API key for real API calls (if missing, runs in STUB MODE)
- `WEBHOOK_URL` - URL to send webhook events
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 900000 = 15 minutes)
- `RATE_LIMIT_MAX` - Max requests per window (default: 100)
- `NODE_ENV` - Environment (development/production)

### Stub Mode

When `WHOP_API_KEY` is not set, the server runs in **STUB MODE**:
- All actions are simulated (no real API calls)
- UI displays a warning banner
- Useful for development and testing

## Usage

### 1. Login

Visit http://localhost:3000 and login with any credentials:
- **Email**: Any valid email
- **Password**: Any password
- **Role**: Choose "User" or "Owner"

> **Note**: Owner role is required to execute plans with publish actions.

### 2. Create a Plan

Fill out the product form:
- **Product Name**: Name of the product
- **Price**: Price (must be > 0)
- **Currency**: USD, EUR, or GBP
- **Billing Interval**: monthly, yearly, weekly, or one_time
- **Mode**: Draft (no publish) or Publish (includes publish action)
- **FAQs**: Optional list of questions and answers

Click "Create Plan" to generate a deterministic plan.

### 3. Approve Plan

Review the generated plan and click "Approve Plan" to mark it as approved.

### 4. Execute Plan

Click "Execute Plan" to run the actions:
- Actions execute sequentially
- Idempotency ensures no duplicate executions
- If any action fails, execution halts immediately
- Partial results are returned

### 5. View Results

- Copy plan or execution JSON with the copy buttons
- If execution fails, see the failed step index and error message
- View completed steps before failure

## API Endpoints

### Authentication

#### POST `/auth/login`
Login with credentials
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "Owner"
}
```

Response:
```json
{
  "token": "jwt-token",
  "user": {
    "userId": "user_123",
    "email": "user@example.com",
    "role": "Owner"
  }
}
```

### Plans

All plan endpoints require authentication (Bearer token).

#### POST `/plans/create`
Create a new plan
```json
{
  "productName": "Premium Membership",
  "price": 29.99,
  "currency": "USD",
  "interval": "monthly",
  "publish": false,
  "faqs": [
    {
      "question": "What is included?",
      "answer": "Everything!"
    }
  ]
}
```

#### GET `/plans/:planId`
Get a specific plan

#### GET `/plans`
Get all plans

#### POST `/plans/:planId/approve`
Approve a plan (changes status from PENDING to APPROVED)

#### POST `/plans/:planId/execute`
Execute a plan (requires Owner role if plan contains publish action)

#### GET `/plans/stub-mode`
Check if server is in stub mode

### Health Check

#### GET `/health`
Server health check

## Testing

Run unit tests:
```bash
cd packages/server
npm test
```

Tests cover:
- Deterministic plan generation
- Input validation
- Idempotency service
- Edge cases

## Production Deployment

1. **Set secure environment variables**
   - Generate a strong `JWT_SECRET`
   - Set `WHOP_API_KEY` for real API calls
   - Configure `WEBHOOK_URL` if needed
   - Set appropriate rate limits

2. **Build the application**
```bash
npm run build
```

3. **Start the server**
```bash
cd packages/server
npm start
```

4. **Deploy UI**
```bash
cd packages/ui
npm run build
# Deploy the dist/ folder to your static hosting
```

5. **Security checklist**
   - ✅ JWT_SECRET is strong and secret
   - ✅ WHOP_API_KEY is not exposed to client
   - ✅ Rate limiting is configured appropriately
   - ✅ HTTPS is enabled in production
   - ✅ Environment variables are properly secured

## Architecture

```
ProductOpsAgent/
├── packages/
│   ├── server/              # Express API server
│   │   ├── src/
│   │   │   ├── index.js     # Server entry point
│   │   │   ├── config.js    # Environment configuration
│   │   │   ├── middleware/  # Auth, rate limiting, logging
│   │   │   ├── routes/      # API routes
│   │   │   └── services/    # Business logic
│   │   │       ├── planGenerator.js   # Deterministic plan generation
│   │   │       ├── executor.js        # Action execution
│   │   │       ├── idempotency.js     # Idempotency service
│   │   │       └── webhook.js         # Webhook events
│   │   └── package.json
│   └── ui/                  # React admin UI
│       ├── src/
│       │   ├── App.jsx      # Main application
│       │   └── main.jsx     # Entry point
│       └── package.json
└── package.json             # Monorepo root
```

## License

ISC
