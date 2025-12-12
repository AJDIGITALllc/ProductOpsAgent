# Security Policy

## Secret Management

**ProductOpsAgent enforces strict secret management policies:**

### ⚠️ CRITICAL RULES

1. **Platform Secret Managers ONLY**
   - ALL secrets MUST be stored in platform secret managers (AWS Secrets Manager, Azure Key Vault, Google Secret Manager, GitHub Secrets, etc.)
   - `.env` files are **STRICTLY PROHIBITED** in production and source control
   - CI/CD will **fail** if any `.env` files are detected in the repository

2. **No .env Files**
   - Do NOT create `.env` files in this repository
   - Do NOT commit `.env` files to source control
   - Use `.env.example` ONLY for documentation purposes
   - Production deployments MUST use platform secret managers

3. **Required Environment Variables**
   - All required environment variables are documented in `.env.example`
   - Secrets must be injected at runtime via platform secret managers
   - The application will fail to start if required secrets are missing

### Environment Variable Requirements

#### Core Configuration
- `NODE_ENV` - Environment: development, staging, or production
- `PLANNER_MODE` - AI planner mode: OPENAI or CLAUDE (required)

#### API Keys (Platform Secret Managers ONLY)
- `OPENAI_API_KEY` - Required when PLANNER_MODE=OPENAI
- `CLAUDE_API_KEY` - Required when PLANNER_MODE=CLAUDE
- `WHOP_API_KEY` - Required for Whop commerce connector
- `GEMINI_API_KEY` - Required for image generation (optional)

#### Whop App Configuration
- `WHOP_APP_ID` - Whop App ID
- `WHOP_APP_SECRET` - Whop App Secret (Platform Secret Manager)
- `WHOP_OAUTH_REDIRECT_URL` - OAuth redirect URL
- `WHOP_WEBHOOK_SECRET` - Webhook signature secret (Platform Secret Manager)

#### Safety Controls
- `EXECUTION_DISABLED` - Global kill switch (set to "true" to disable all execution)
- `DAILY_EXECUTION_QUOTA` - Maximum executions per day (default: 100)
- `DAILY_PLANNER_QUOTA` - Maximum planner calls per day (default: 1000)
- `DAILY_IMAGE_QUOTA` - Maximum images generated per day (default: 50)

### Deployment Guidelines

#### Development
- Use local environment variables for development
- Never commit secrets to source control
- Use `.env.example` as a template

#### Staging/Production
- Configure secrets in your platform secret manager:
  - **AWS**: AWS Secrets Manager + ECS/Lambda environment variables
  - **Azure**: Azure Key Vault + App Service configuration
  - **Google Cloud**: Secret Manager + Cloud Run/GKE environment variables
  - **GitHub Actions**: GitHub Secrets + workflow environment variables

### Logging Security

- Logs NEVER contain API keys or secrets
- Logs only indicate whether a key is configured (present) or missing
- Token usage and costs are logged, but never key values

### CI/CD Enforcement

The `secret-hygiene.yml` GitHub Action enforces:
1. No `.env` files present in repository
2. No hardcoded `.env` references in code
3. All checks run on push and pull requests

### Startup Validation

The application enforces security at startup:
- Fails immediately if `PLANNER_MODE=OPENAI` and `OPENAI_API_KEY` is missing
- Fails immediately if required secrets are not configured
- Logs configuration status without revealing secret values

## Reporting Security Issues

If you discover a security vulnerability, please email security@audiojones.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fixes (if any)

Do NOT open public GitHub issues for security vulnerabilities.

## Security Updates

- Security patches will be released as soon as possible
- Critical updates will be announced via GitHub Security Advisories
- Subscribe to repository notifications for security alerts
