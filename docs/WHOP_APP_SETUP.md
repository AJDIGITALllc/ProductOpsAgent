# Whop App Registration and Setup

This guide walks you through registering, installing, and authorizing the ProductOpsAgent as a Whop App.

## Prerequisites

- Whop account with shop owner or admin privileges
- ProductOpsAgent API deployed and accessible
- HTTPS endpoint for webhooks

## Step 1: Register Your Whop App

1. Navigate to [Whop Developer Portal](https://whop.com/developers)
2. Click "Create New App"
3. Fill in app details:
   - **App Name**: ProductOpsAgent
   - **Description**: Automated product operations and management
   - **Category**: Commerce Tools

## Step 2: Configure OAuth Settings

### OAuth Redirect URLs

Add the following OAuth redirect URLs in your Whop App settings:

**Production:**
```
https://ops.audiojones.com/auth/callback
```

**Staging:**
```
https://staging-ops.audiojones.com/auth/callback
```

**Development:**
```
http://localhost:3001/auth/callback
```

### Required OAuth Scopes

Request the following scopes for your app:
- `products:read` - Read product information
- `products:write` - Create and update products
- `products:delete` - Delete products (for cleanup/rollback)
- `webhooks:read` - Read webhook configuration
- `webhooks:write` - Create and manage webhooks

## Step 3: Register Webhook Endpoints

Configure the following webhook endpoints in your Whop App:

### Webhook URL

**Production:**
```
https://ops-api.audiojones.com/api/webhooks/whop
```

**Staging:**
```
https://staging-ops-api.audiojones.com/api/webhooks/whop
```

**Development:**
```
http://localhost:3000/api/webhooks/whop
```

### Webhook Events

Subscribe to the following events:
- `product.created` - Product creation events
- `product.updated` - Product update events
- `product.deleted` - Product deletion events
- `product.published` - Product publication events
- `order.created` - Order creation (for analytics)
- `payment.succeeded` - Payment events (for analytics)

### Webhook Security

1. Copy the **Webhook Secret** from your Whop App settings
2. Store it in your platform secret manager as `WHOP_WEBHOOK_SECRET`
3. The API will automatically verify webhook signatures using this secret

## Step 4: Configure Environment Variables

After creating your Whop App, configure the following environment variables:

```bash
# Whop App Credentials (store in platform secret manager)
WHOP_APP_ID=app_xxx
WHOP_APP_SECRET=secret_xxx
WHOP_API_KEY=api_xxx
WHOP_WEBHOOK_SECRET=whsec_xxx

# OAuth Configuration
WHOP_OAUTH_REDIRECT_URL=https://ops.audiojones.com/auth/callback
```

## Step 5: Install App in Your Whop Shop

1. Navigate to your Whop Shop admin panel
2. Go to **Apps** → **Browse Apps**
3. Search for "ProductOpsAgent" (or use your app's install link)
4. Click **Install**
5. Review requested permissions
6. Click **Authorize**

## Step 6: Map Owner/Admin Roles

### Role Mapping

The ProductOpsAgent uses the following role mapping:

| Whop Role | ProductOpsAgent Access |
|-----------|------------------------|
| Owner | Full access to all operations |
| Admin | Full access to all operations |
| Manager | Read-only access to metrics and logs |
| Support | No access (redirect to public docs) |

### Configure Role Permissions

In your Whop App settings:

1. Navigate to **Permissions** → **Role Mapping**
2. Configure access levels:
   - **Owner/Admin**: `full_access`
   - **Manager**: `read_only`
   - **Support**: `no_access`

## Step 7: Verify Installation

### Test OAuth Flow

1. Navigate to `https://ops.audiojones.com`
2. Click "Connect to Whop"
3. Authorize the app
4. Verify you are redirected back with a valid session

### Test Webhook Delivery

1. Create a test product in Whop admin
2. Check API logs for webhook receipt: `GET /metrics`
3. Verify webhook signature validation passed
4. Confirm event was processed successfully

### Test API Access

Run the following command to verify API access:

```bash
curl -X GET https://ops-api.audiojones.com/health \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response:
```json
{
  "status": "healthy",
  "mode": "OPENAI",
  "executionEnabled": true,
  "environment": "production"
}
```

## Troubleshooting

### OAuth Errors

**Error: `invalid_redirect_uri`**
- Verify redirect URL matches exactly in Whop App settings
- Check for trailing slashes or protocol mismatches

**Error: `insufficient_scope`**
- Review requested scopes in Whop App settings
- Re-install the app to request updated permissions

### Webhook Issues

**Webhooks not being received:**
1. Verify webhook URL is publicly accessible
2. Check firewall rules allow Whop webhook IPs
3. Review webhook logs in Whop Developer Portal

**Signature verification failures:**
1. Verify `WHOP_WEBHOOK_SECRET` is correctly configured
2. Check secret matches the one in Whop App settings
3. Ensure webhook payload is not modified in transit

### API Authentication Issues

**Error: `WHOP_API_KEY not configured`**
- Verify API key is stored in platform secret manager
- Check environment variable is correctly injected at runtime

**Error: `invalid_api_key`**
- Regenerate API key in Whop Developer Portal
- Update stored secret in platform secret manager

## Security Best Practices

1. **Never commit secrets to source control**
   - Always use platform secret managers
   - Rotate secrets regularly

2. **Verify webhook signatures**
   - Always validate `X-Whop-Signature` header
   - Reject webhooks with invalid signatures

3. **Use HTTPS in production**
   - Never expose webhook endpoints over HTTP
   - Enable HSTS headers

4. **Implement rate limiting**
   - Limit API requests to prevent abuse
   - Monitor for unusual traffic patterns

5. **Audit access logs**
   - Review authentication logs regularly
   - Alert on suspicious activity

## Support

For issues with Whop App registration or API access:
- Whop Support: support@whop.com
- Whop Developer Docs: https://docs.whop.com
- ProductOpsAgent Issues: https://github.com/AJDIGITALllc/ProductOpsAgent/issues
