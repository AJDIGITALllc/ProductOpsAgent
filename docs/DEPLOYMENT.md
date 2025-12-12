# Deployment Guide

This guide covers deploying ProductOpsAgent to production, staging, and development environments.

## Architecture Overview

ProductOpsAgent consists of two main components:

1. **API Server** (`ops-api.audiojones.com`)
   - RESTful API for plan generation and execution
   - Webhook endpoints for Whop events
   - Metrics and health check endpoints

2. **Admin UI** (`ops.audiojones.com`)
   - User interface for operators
   - Product creation and management
   - Plan review and approval

## Environment Separation

### Development

**Domains:**
- UI: `http://localhost:3001`
- API: `http://localhost:3000`

**Configuration:**
- No SSL/TLS required
- CORS allows localhost origins
- Relaxed cookie settings
- Higher rate limits

**Environment Variables:**
- See `config/deployment/development.json`
- Minimal required variables
- Can use `.env.example` as template (NOT `.env` file!)

### Staging

**Domains:**
- UI: `https://staging-ops.audiojones.com`
- API: `https://staging-ops-api.audiojones.com`

**Configuration:**
- SSL/TLS required
- HSTS enabled (no preload)
- CORS restricted to staging UI
- Moderate rate limits

**Environment Variables:**
- See `config/deployment/staging.json`
- All production secrets required
- Can use test API keys where available

### Production

**Domains:**
- UI: `https://ops.audiojones.com`
- API: `https://ops-api.audiojones.com`

**Configuration:**
- SSL/TLS required
- HSTS with preload
- Strict CORS (UI → API only)
- Secure cookies only
- Production rate limits

**Environment Variables:**
- See `config/deployment/production.json`
- ALL secrets from platform secret manager
- NO `.env` files allowed

## Required Environment Variables

### By Environment

#### Development
```bash
PLANNER_MODE=OPENAI  # or CLAUDE
```

#### Staging & Production
```bash
# Core
NODE_ENV=staging  # or production
PORT=3000
PLANNER_MODE=OPENAI  # or CLAUDE

# AI API Keys (from secret manager)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Whop Configuration (from secret manager)
WHOP_API_KEY=...
WHOP_APP_ID=app_...
WHOP_APP_SECRET=secret_...
WHOP_OAUTH_REDIRECT_URL=https://ops.audiojones.com/auth/callback
WHOP_WEBHOOK_SECRET=whsec_...

# Deployment URLs
API_URL=https://ops-api.audiojones.com
UI_URL=https://ops.audiojones.com
CORS_ORIGIN=https://ops.audiojones.com

# Storage
STORAGE_BUCKET=productops-assets
STORAGE_REGION=us-east-1

# Security
COOKIE_SECRET=<random-secret-from-secret-manager>

# Quotas
DAILY_EXECUTION_QUOTA=100
DAILY_PLANNER_QUOTA=1000
DAILY_IMAGE_QUOTA=50
```

## Deployment Steps

### 1. Pre-deployment Checklist

- [ ] All secrets configured in platform secret manager
- [ ] DNS records created for subdomains
- [ ] SSL certificates provisioned
- [ ] Firewall rules configured
- [ ] Whop App registered (see `docs/WHOP_APP_SETUP.md`)

### 2. Deploy API Server

#### Option A: AWS (ECS/Fargate)

```bash
# Build Docker image
docker build -t productopsagent-api .

# Tag for ECR
docker tag productopsagent-api:latest \
  <account>.dkr.ecr.us-east-1.amazonaws.com/productopsagent-api:latest

# Push to ECR
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/productopsagent-api:latest

# Update ECS service
aws ecs update-service \
  --cluster productops \
  --service api \
  --force-new-deployment
```

#### Option B: Google Cloud Run

```bash
# Deploy with secrets from Secret Manager
gcloud run deploy productopsagent-api \
  --image gcr.io/<project>/productopsagent-api:latest \
  --platform managed \
  --region us-east1 \
  --set-env-vars NODE_ENV=production,PLANNER_MODE=OPENAI \
  --set-secrets OPENAI_API_KEY=openai-key:latest,WHOP_API_KEY=whop-key:latest \
  --allow-unauthenticated
```

#### Option C: Azure App Service

```bash
# Deploy with Key Vault references
az webapp config appsettings set \
  --resource-group productops \
  --name productopsagent-api \
  --settings \
    NODE_ENV=production \
    PLANNER_MODE=OPENAI \
    OPENAI_API_KEY="@Microsoft.KeyVault(SecretUri=https://vault.vault.azure.net/secrets/openai-key/)" \
    WHOP_API_KEY="@Microsoft.KeyVault(SecretUri=https://vault.vault.azure.net/secrets/whop-key/)"
```

### 3. Deploy Admin UI

The Admin UI is a static frontend (implementation not included in this repository).

Deploy to:
- AWS S3 + CloudFront
- Azure Static Web Apps
- Google Cloud Storage + CDN
- Netlify/Vercel

### 4. Validate Deployment

Run the production validation script:

```bash
./scripts/validate-prod.sh https://ops-api.audiojones.com
```

Expected output:
```
==================================
ProductOpsAgent Production Validation
==================================
API URL: https://ops-api.audiojones.com

1. Health Check (REAL mode)
✓ Health check passed
✓ Execution is enabled
✓ Planner mode: OPENAI

2. Planner Dry-Run
✓ Plan generated: <plan-id>

3. Plan Approval (Review)
✓ Plan ready for review

4. Execute Non-Publish Draft
✓ Dry-run execution completed

5. Verify Metrics
✓ Metrics endpoint accessible
✓ Planner metrics present
✓ Execution metrics present
✓ Quota metrics present

6. Verify Webhook Endpoint
✓ Webhook endpoint accessible
✓ Webhook signature verification is enabled

==================================
✓ All validation checks passed!
==================================
```

### 5. Configure Monitoring

Set up monitoring for:

- Health check endpoint: `GET /health`
- Metrics endpoint: `GET /metrics`
- Error logs
- API latency
- Quota usage

### 6. Configure Alerts

Set up alerts for:

- Health check failures
- High error rates
- Quota exhaustion
- Authentication failures
- Unusual traffic patterns

## Security Configuration

### CORS

API server enforces strict CORS:

```javascript
{
  origin: 'https://ops.audiojones.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}
```

### HSTS

HSTS is enabled in production:

```javascript
{
  maxAge: 31536000,  // 1 year
  includeSubDomains: true,
  preload: true
}
```

### Secure Cookies

Cookies are configured for security:

```javascript
{
  secure: true,        // HTTPS only
  httpOnly: true,      // No JavaScript access
  sameSite: 'strict',  // CSRF protection
  domain: '.audiojones.com'
}
```

### Rate Limiting

API endpoints are rate limited:

- Production: 100 requests per 15 minutes
- Staging: 200 requests per 15 minutes
- Development: 1000 requests per 15 minutes

## Rollback Procedure

If issues are detected after deployment:

1. **Immediate rollback:**
   ```bash
   # AWS ECS
   aws ecs update-service --cluster productops --service api --task-definition <previous-revision>
   
   # Google Cloud Run
   gcloud run services update-traffic productopsagent-api --to-revisions <previous-revision>=100
   
   # Azure App Service
   az webapp deployment slot swap --resource-group productops --name productopsagent-api --slot staging --target-slot production
   ```

2. **Enable kill switch:**
   ```bash
   EXECUTION_DISABLED=true
   ```

3. **Investigate and fix issues**

4. **Re-deploy after validation**

## Scaling

### Horizontal Scaling

API server is stateless and can be scaled horizontally:

- AWS: Increase ECS task count
- Google Cloud: Increase Cloud Run instances
- Azure: Scale out App Service

### Vertical Scaling

If needed, increase resources:

- CPU: 1-2 vCPUs recommended
- Memory: 1-2 GB recommended
- Storage: Minimal (stateless)

### Quotas and Limits

Adjust based on expected load:

```bash
DAILY_EXECUTION_QUOTA=100    # Increase for high-volume shops
DAILY_PLANNER_QUOTA=1000     # Increase for high plan generation
DAILY_IMAGE_QUOTA=50         # Increase for image-heavy products
```

## Troubleshooting

See `OPERATOR.md` for detailed troubleshooting procedures.

### Common Issues

**Issue: Health check failing**
- Verify environment variables are set
- Check secret manager configuration
- Review application logs

**Issue: CORS errors**
- Verify CORS_ORIGIN matches UI domain exactly
- Check for protocol mismatches (http vs https)

**Issue: Webhook signature failures**
- Verify WHOP_WEBHOOK_SECRET matches Whop App settings
- Check for secret rotation issues

## Support

- **Documentation**: `/docs` directory
- **GitHub Issues**: https://github.com/AJDIGITALllc/ProductOpsAgent/issues
- **Email**: support@audiojones.com
