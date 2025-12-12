# ProductOpsAgent

A production-ready AI-powered product operations agent that executes commerce actions through the Whop API with guardrails, logging, telemetry, and safety controls.

## Overview

ProductOpsAgent allows operators to create and manage products through natural language commands. Simply say: "Create a new product called X, price it at Y, make it recurring, add FAQs," and the agent generates a plan, validates it, and executes the actions through the Whop API.

## Features

- 🤖 **AI-Powered Planning**: Supports OpenAI and Claude for intelligent plan generation
- 🔒 **Security First**: Enforces platform secret managers, no `.env` files, startup validation
- 📊 **Comprehensive Telemetry**: Tracks planner latency, token usage, execution metrics, and quotas
- 🚦 **Safety Controls**: Daily quotas, execution kill switch, dry-run mode
- 🎨 **Image Generation**: Gemini-powered product image generation with daily caps
- 🔌 **Connector Architecture**: Generic interface supporting Whop (ready) and Gumroad (skeleton)
- 🌐 **Production Ready**: CORS, HSTS, secure cookies, environment separation
- 📱 **Whop App Support**: OAuth, webhooks, role mapping fully documented
- 📖 **Operator Playbook**: Complete guide for safe operations and incident response

## Quick Start

### Prerequisites

- Node.js 18+
- Platform secret manager (AWS Secrets Manager, Azure Key Vault, Google Secret Manager, etc.)
- Whop App credentials (see [Whop App Setup](docs/WHOP_APP_SETUP.md))

### Installation

```bash
# Clone the repository
git clone https://github.com/AJDIGITALllc/ProductOpsAgent.git
cd ProductOpsAgent

# Install dependencies
npm install

# Configure environment variables (use platform secret manager in production!)
# See .env.example for required variables

# Start the server
npm start
```

### Development

```bash
# Run in development mode with auto-reload
npm run dev
```

### Validation

```bash
# Validate production deployment
npm run validate
# or
./scripts/validate-prod.sh https://ops-api.audiojones.com
```

## Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - How to deploy to dev/staging/production
- **[Whop App Setup](docs/WHOP_APP_SETUP.md)** - Register and configure Whop App
- **[Operator Playbook](OPERATOR.md)** - Operations guide for running in production
- **[Security Policy](SECURITY.md)** - Security requirements and best practices

## Environment Variables

See `.env.example` for a complete list of environment variables.

### Required (Production)

```bash
NODE_ENV=production
PLANNER_MODE=OPENAI              # or CLAUDE
OPENAI_API_KEY=sk-...            # from secret manager
WHOP_API_KEY=...                 # from secret manager
WHOP_APP_ID=app_...
WHOP_APP_SECRET=secret_...       # from secret manager
WHOP_OAUTH_REDIRECT_URL=https://ops.audiojones.com/auth/callback
WHOP_WEBHOOK_SECRET=whsec_...    # from secret manager
GEMINI_API_KEY=...               # from secret manager
```

### Optional

```bash
EXECUTION_DISABLED=false         # Global kill switch
DAILY_EXECUTION_QUOTA=100        # Max executions per day
DAILY_PLANNER_QUOTA=1000         # Max planner calls per day
DAILY_IMAGE_QUOTA=50             # Max images per day
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Metrics (Read-only)
```bash
GET /metrics              # All metrics
GET /metrics/planner      # Planner-specific
GET /metrics/execution    # Execution-specific
GET /metrics/images       # Image generation
```

### Planner
```bash
POST /api/planner/generate
{
  "prompt": "Create a product called Premium Course, price it at $99, make it recurring monthly"
}

POST /api/planner/execute
{
  "planId": "uuid",
  "dryRun": true  # Set to false for real execution
}
```

### Webhooks
```bash
POST /api/webhooks/whop
# Receives webhooks from Whop with signature verification
```

## Safety Features

### 1. Secret Hygiene
- CI check fails if `.env` files are present
- Startup fails if required secrets are missing
- Logs never reveal API keys

### 2. Execution Controls
- `EXECUTION_DISABLED` global kill switch
- Daily execution quota enforcement
- Dry-run mode for all plans
- Plan approval workflow

### 3. Rate Limits
- Daily planner call quota
- Daily execution quota
- Daily image generation quota

### 4. Telemetry
- Planner latency tracking
- Token usage monitoring
- Execution success rates
- Real-time metrics endpoint

## Connector Interface

ProductOpsAgent uses a generic `CommerceConnector` interface that abstracts commerce platform specifics:

```javascript
class CommerceConnector {
  async createProduct(params)
  async updatePricing(params)
  async setDescription(params)
  async addFAQs(params)
  async setImage(params)
  async addMedia(params)
  async publish(params)
}
```

### Supported Connectors

- ✅ **Whop** - Full implementation
- 🚧 **Gumroad** - Skeleton only (coming soon)

## Whitelisted Actions

- `create_product` - Create a new product
- `update_pricing` - Set or update pricing
- `set_description` - Set product description
- `add_faqs` - Add FAQ items
- `set_image` - Generate and attach product image (Gemini)
- `add_media` - Add media assets
- `publish` - Publish product (make it live)

## Security

### Secret Management
- **NEVER** commit `.env` files
- **ALWAYS** use platform secret managers in production
- See [SECURITY.md](SECURITY.md) for complete policy

### CI Enforcement
- GitHub Action checks for `.env` files on every push
- Fails if `.env` files are detected
- Fails if hardcoded `.env` references are found

### Deployment Security
- Strict CORS (UI → API only)
- HSTS headers with preload
- Secure cookies (httpOnly, secure, sameSite)
- Webhook signature verification

## Monitoring

Monitor these key metrics:

1. **Health**: `GET /health` - Service status
2. **Planner**: Average latency, token usage, calls per day
3. **Execution**: Success rate, quota usage
4. **Images**: Generation count, quota usage

Set up alerts for:
- Health check failures
- Success rate < 90%
- Quota usage > 80%
- Authentication failures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all checks pass (including secret hygiene)
5. Submit a pull request

## License

ISC License - see LICENSE file for details

## Support

- **GitHub Issues**: https://github.com/AJDIGITALllc/ProductOpsAgent/issues
- **Documentation**: See `/docs` directory
- **Email**: support@audiojones.com

## Acknowledgments

- Built for the Whop commerce platform
- Powered by OpenAI, Anthropic Claude, and Google Gemini
- Inspired by the need for safe, auditable product operations
