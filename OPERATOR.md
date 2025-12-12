# Operator Playbook

This guide is for operators running ProductOpsAgent in production. It covers safe product creation, failure interpretation, recovery procedures, and when to adjust system settings.

## Table of Contents

1. [Safe Product Creation](#safe-product-creation)
2. [Interpreting Failures](#interpreting-failures)
3. [Recovery from Partial Execution](#recovery-from-partial-execution)
4. [When to Switch PLANNER_MODE](#when-to-switch-planner_mode)
5. [When to Disable Execution](#when-to-disable-execution)
6. [Monitoring and Alerts](#monitoring-and-alerts)
7. [Emergency Procedures](#emergency-procedures)

---

## Safe Product Creation

### Pre-flight Checklist

Before creating products, verify:

- [ ] All required environment variables are configured
- [ ] API health check returns `status: "healthy"`
- [ ] Daily quotas have not been exceeded (`GET /metrics`)
- [ ] `EXECUTION_DISABLED` is set to `false` (or unset)
- [ ] Planner mode is correctly configured for your use case

### Creating a Product Safely

1. **Generate a Plan First (Dry-Run)**
   ```bash
   POST /api/planner/generate
   {
     "prompt": "Create a product called Premium Course, price it at $99, make it recurring monthly"
   }
   ```

2. **Review the Plan**
   - Check all actions in the plan
   - Verify pricing, descriptions, and settings
   - Ensure no unintended actions are included

3. **Execute as Dry-Run**
   ```bash
   POST /api/planner/execute
   {
     "planId": "plan-uuid",
     "dryRun": true
   }
   ```
   
4. **Execute for Real (Only After Verification)**
   ```bash
   POST /api/planner/execute
   {
     "planId": "plan-uuid",
     "dryRun": false
   }
   ```

### Best Practices

- **Always start with dry-run**: Never execute directly without reviewing the plan
- **Monitor quotas**: Check `/metrics` regularly to avoid hitting limits
- **Test in staging first**: Use staging environment for new product types
- **One product at a time**: Don't create multiple products simultaneously until confident
- **Keep prompts clear**: Use specific, unambiguous language in prompts

---

## Interpreting Failures

### Common Failure Types

#### 1. Quota Exceeded Errors

**Symptom:**
```
Daily execution quota exceeded (100)
Daily planner quota exceeded (1000)
Daily image quota exceeded (50)
```

**Cause:** You've hit the daily limit for executions, planner calls, or image generation.

**Resolution:**
- Wait for daily reset (midnight UTC)
- Or increase quota limits via environment variables
- Review usage patterns to prevent future overages

#### 2. Environment Validation Failures

**Symptom:**
```
OPENAI_API_KEY is required when PLANNER_MODE=OPENAI
Environment validation failed
```

**Cause:** Required API keys or environment variables are missing or incorrect.

**Resolution:**
1. Check platform secret manager configuration
2. Verify secrets are correctly injected at runtime
3. Restart the service after fixing configuration

#### 3. Connector Errors

**Symptom:**
```
WHOP_API_KEY not configured
Action failed: create_product
```

**Cause:** Commerce connector cannot authenticate or execute action.

**Resolution:**
1. Verify API keys are valid and not expired
2. Check API rate limits haven't been exceeded
3. Review connector-specific logs for details
4. Test API access directly with curl

#### 4. Planner Errors

**Symptom:**
```
Plan generation failed
Invalid action in plan
```

**Cause:** LLM returned invalid or malformed plan.

**Resolution:**
1. Rephrase the prompt more clearly
2. Switch planner modes (OPENAI ↔ CLAUDE)
3. Check token limits and prompt length
4. Review planner logs for specific errors

#### 5. Execution Disabled

**Symptom:**
```
Execution is globally disabled (EXECUTION_DISABLED=true)
```

**Cause:** Global kill switch is active.

**Resolution:**
- This is intentional - check with team before re-enabling
- See [When to Disable Execution](#when-to-disable-execution)

---

## Recovery from Partial Execution

### Understanding Partial Execution

A plan may fail midway through execution, leaving the product in a partially created state:

```
✓ create_product - Success
✓ update_pricing - Success
✗ add_faqs - Failed
✗ publish - Not executed
```

### Recovery Steps

#### Step 1: Identify What Succeeded

Check the execution results:
```bash
GET /api/planner/results/{planId}
```

Review which actions completed successfully.

#### Step 2: Manual Cleanup or Completion

**Option A: Complete the Failed Actions**

1. Find the product ID from successful actions
2. Manually complete failed actions via API or Whop admin
3. Verify product is in correct state

**Option B: Delete and Start Over**

1. Delete the partially created product via Whop admin
2. Generate a new plan with corrected parameters
3. Execute with dry-run first
4. Execute for real

**Option C: Rollback (Future Feature)**

Currently, rollback is manual. Future versions will support automatic rollback.

#### Step 3: Document the Incident

Log the incident for future reference:
- What failed and why
- How you recovered
- What to do differently next time

### Preventing Partial Execution

- Always use dry-run first
- Monitor execution logs in real-time
- Set appropriate quotas and limits
- Test thoroughly in staging

---

## When to Switch PLANNER_MODE

ProductOpsAgent supports two planner modes: `OPENAI` and `CLAUDE`.

### When to Use OPENAI

**Use OPENAI when:**
- You need fast response times
- Working with straightforward product creation
- Cost per request is a concern
- You have existing OpenAI credits

**Pros:**
- Faster inference
- Lower cost per token
- Well-tested with function calling

**Cons:**
- May require more specific prompts
- Less context window than Claude

### When to Use CLAUDE

**Use CLAUDE when:**
- You need more sophisticated reasoning
- Working with complex product configurations
- Prompts are lengthy or conversational
- You need better instruction following

**Pros:**
- Larger context window
- Better at following complex instructions
- More reliable with edge cases

**Cons:**
- Slightly higher latency
- Higher cost per token

### Switching Modes

To switch planner modes:

1. **Update environment variable:**
   ```bash
   PLANNER_MODE=CLAUDE
   # or
   PLANNER_MODE=OPENAI
   ```

2. **Ensure API key is configured:**
   ```bash
   # For Claude
   CLAUDE_API_KEY=sk-ant-xxx
   
   # For OpenAI
   OPENAI_API_KEY=sk-xxx
   ```

3. **Restart the service**

4. **Verify health check:**
   ```bash
   curl https://ops-api.audiojones.com/health
   ```

5. **Test with a simple plan:**
   - Generate and execute a simple test plan
   - Verify results are as expected
   - Monitor for any errors

### Best Practice

- Stick with one mode for consistency
- Only switch if experiencing persistent issues
- Document why you switched for future operators

---

## When to Disable Execution

The `EXECUTION_DISABLED` environment variable is a **global kill switch** that prevents all execution actions while keeping the planner and API operational.

### When to Enable the Kill Switch

**Enable `EXECUTION_DISABLED=true` when:**

1. **Investigating Production Issues**
   - Unexpected product creation behavior
   - Suspected bugs in execution logic
   - Debugging connector issues

2. **Maintenance Windows**
   - Updating Whop API keys
   - Performing system upgrades
   - Database maintenance

3. **Emergency Situations**
   - Runaway execution loop
   - API rate limit exceeded
   - Billing concerns
   - Security incident

4. **Testing**
   - Testing planner changes without executing
   - Validating new prompts
   - Training new operators

### How to Disable Execution

1. **Set environment variable:**
   ```bash
   EXECUTION_DISABLED=true
   ```

2. **Restart the service** (or use runtime config if supported)

3. **Verify via health check:**
   ```bash
   curl https://ops-api.audiojones.com/health
   # Should return: "executionEnabled": false
   ```

### What Still Works When Disabled

- Plan generation (`POST /api/planner/generate`)
- Dry-run execution (`dryRun: true`)
- Metrics and monitoring (`GET /metrics`)
- Health checks (`GET /health`)
- Webhook receipt (but not processing)

### What Doesn't Work

- Real execution (`dryRun: false`)
- Any action that modifies products
- Image generation (connected to execution)

### Re-enabling Execution

1. **Verify the issue is resolved**
2. **Set environment variable:**
   ```bash
   EXECUTION_DISABLED=false
   # or unset it entirely
   ```
3. **Restart the service**
4. **Test with a simple dry-run first**
5. **Execute a test product**
6. **Monitor closely for issues**

---

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Planner Metrics** (`GET /metrics/planner`)
   - Total and daily planner calls
   - Average latency
   - Token usage
   - Average plan size

2. **Execution Metrics** (`GET /metrics/execution`)
   - Total and daily executions
   - Success rate
   - Failures

3. **Image Metrics** (`GET /metrics/images`)
   - Total and daily images generated
   - Quota usage

4. **Health Status** (`GET /health`)
   - Service health
   - Execution enabled status
   - Current planner mode

### Recommended Alert Thresholds

Set up alerts for:

- **Success rate < 90%**: Investigate execution failures
- **Quota usage > 80%**: Approaching daily limits
- **Average latency > 5s**: Planner performance degradation
- **Health check fails**: Service is down
- **Execution disabled**: Kill switch activated

### Log Monitoring

Monitor logs for:
- `❌` Error indicators
- `⚠️` Warning indicators
- Quota exceeded messages
- Authentication failures
- Webhook signature failures

---

## Emergency Procedures

### Emergency: Runaway Execution

**Symptoms:** Unexpected product creation, quota exceeded, high API usage

**Immediate Actions:**
1. Enable kill switch: `EXECUTION_DISABLED=true`
2. Restart service
3. Verify execution stopped via health check
4. Review recent plans and executions
5. Delete any unintended products via Whop admin

**Root Cause Analysis:**
- Review prompts that triggered runaway
- Check for bugs in planner logic
- Verify quota limits are appropriate

**Prevention:**
- Implement stricter quotas
- Add confirmation step for bulk operations
- Improve prompt validation

### Emergency: API Authentication Failed

**Symptoms:** All executions failing, `invalid_api_key` errors

**Immediate Actions:**
1. Verify API keys in secret manager
2. Check for key expiration or revocation
3. Regenerate keys if necessary
4. Update secrets in production
5. Restart service

**Prevention:**
- Set up key rotation reminders
- Monitor authentication success rate
- Use alerts for auth failures

### Emergency: Quota Exhausted

**Symptoms:** `Daily quota exceeded` errors

**Immediate Actions:**
1. Check if quota was legitimately exceeded
2. Review recent usage patterns
3. If unexpected, investigate for abuse
4. If legitimate, increase quota limits
5. Wait for daily reset if no action needed

**Prevention:**
- Set quotas appropriately for expected load
- Monitor quota usage daily
- Alert at 80% threshold

### Emergency: Service Down

**Symptoms:** Health check failing, API unreachable

**Immediate Actions:**
1. Check service logs for errors
2. Verify environment variables are set
3. Check platform/hosting status
4. Restart service
5. Verify connectivity to dependencies (Whop API, LLM APIs)

**Recovery:**
1. Fix root cause (config, deployment, etc.)
2. Restart service
3. Run health check
4. Test with simple plan
5. Monitor for recurrence

---

## Getting Help

### Self-Service Resources

- **Health Check**: `GET /health`
- **Metrics**: `GET /metrics`
- **Logs**: Check application logs
- **Documentation**: Review `/docs` directory

### Support Channels

- **GitHub Issues**: https://github.com/AJDIGITALllc/ProductOpsAgent/issues
- **Email**: support@audiojones.com
- **Whop Support**: For Whop-specific issues

### When Opening an Issue

Include:
- Error messages and stack traces
- Health check output
- Metrics snapshot
- Steps to reproduce
- Environment (dev/staging/prod)
- Planner mode in use
