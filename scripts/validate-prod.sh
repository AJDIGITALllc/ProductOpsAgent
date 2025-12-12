#!/bin/bash

# Production Validation Script
# 
# This script validates that ProductOpsAgent is properly deployed and operational.
# It must exit non-zero on any failure.
#
# Usage: ./scripts/validate-prod.sh [API_URL]
# Example: ./scripts/validate-prod.sh https://ops-api.audiojones.com

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${1:-https://ops-api.audiojones.com}"
TIMEOUT=30

echo "=================================="
echo "ProductOpsAgent Production Validation"
echo "=================================="
echo "API URL: $API_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Helper functions
function print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

function print_error() {
  echo -e "${RED}✗${NC} $1"
}

function print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

function check_health() {
  echo "1. Health Check (REAL mode)"
  echo "----------------------------"
  
  local response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$API_URL/health")
  local body=$(echo "$response" | head -n -1)
  local status=$(echo "$response" | tail -n 1)
  
  if [ "$status" != "200" ]; then
    print_error "Health check failed (HTTP $status)"
    echo "Response: $body"
    exit 1
  fi
  
  # Check if jq is available for JSON parsing
  if command -v jq >/dev/null 2>&1; then
    # Use jq for proper JSON parsing
    local health_status=$(echo "$body" | jq -r '.status')
    local execution_enabled=$(echo "$body" | jq -r '.executionEnabled')
    local mode=$(echo "$body" | jq -r '.mode')
    
    if [ "$health_status" = "healthy" ]; then
      print_success "Health check passed"
    else
      print_error "Health check returned unhealthy status: $health_status"
      echo "Response: $body"
      exit 1
    fi
    
    if [ "$execution_enabled" = "false" ]; then
      print_warning "Execution is disabled (EXECUTION_DISABLED=true)"
    else
      print_success "Execution is enabled"
    fi
    
    if [ ! -z "$mode" ] && [ "$mode" != "null" ]; then
      print_success "Planner mode: $mode"
    fi
  else
    # Fallback to grep if jq not available (less reliable)
    print_warning "jq not found - using basic grep parsing (less reliable)"
    if echo "$body" | grep -q '"status":"healthy"'; then
      print_success "Health check passed"
    else
      print_error "Health check returned unhealthy status"
      echo "Response: $body"
      exit 1
    fi
    
    if echo "$body" | grep -q '"executionEnabled":false'; then
      print_warning "Execution is disabled (EXECUTION_DISABLED=true)"
    else
      print_success "Execution is enabled"
    fi
    
    local mode=$(echo "$body" | grep -o '"mode":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$mode" ]; then
      print_success "Planner mode: $mode"
    fi
  fi
  
  echo ""
}

function test_planner_dryrun() {
  echo "2. Planner Dry-Run"
  echo "----------------------------"
  
  local prompt="Create a test product called Validation Test, price it at \$10"
  local payload="{\"prompt\":\"$prompt\"}"
  
  print_warning "Generating plan..."
  
  local response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
    -X POST "$API_URL/api/planner/generate" \
    -H "Content-Type: application/json" \
    -d "$payload")
  
  local body=$(echo "$response" | head -n -1)
  local status=$(echo "$response" | tail -n 1)
  
  if [ "$status" != "200" ]; then
    print_error "Plan generation failed (HTTP $status)"
    echo "Response: $body"
    exit 1
  fi
  
  # Extract plan ID
  local plan_id
  if command -v jq >/dev/null 2>&1; then
    plan_id=$(echo "$body" | jq -r '.plan.id')
  else
    plan_id=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  fi
  
  if [ -z "$plan_id" ] || [ "$plan_id" = "null" ]; then
    print_error "Could not extract plan ID from response"
    echo "Response: $body"
    exit 1
  fi
  
  print_success "Plan generated: $plan_id"
  
  # Store plan ID for next steps
  echo "$plan_id" > /tmp/validation-plan-id.txt
  
  echo ""
}

function test_plan_approval() {
  echo "3. Plan Approval (Review)"
  echo "----------------------------"
  
  local plan_id=$(cat /tmp/validation-plan-id.txt)
  
  if [ -z "$plan_id" ]; then
    print_error "No plan ID available"
    exit 1
  fi
  
  print_success "Plan $plan_id ready for review"
  print_warning "In production, operator should review plan before execution"
  
  echo ""
}

function test_execute_draft() {
  echo "4. Execute Non-Publish Draft"
  echo "----------------------------"
  
  local plan_id=$(cat /tmp/validation-plan-id.txt)
  
  if [ -z "$plan_id" ]; then
    print_error "No plan ID available"
    exit 1
  fi
  
  print_warning "Executing plan as dry-run..."
  
  local payload="{\"planId\":\"$plan_id\",\"dryRun\":true}"
  
  local response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
    -X POST "$API_URL/api/planner/execute" \
    -H "Content-Type: application/json" \
    -d "$payload")
  
  local body=$(echo "$response" | head -n -1)
  local status=$(echo "$response" | tail -n 1)
  
  if [ "$status" != "200" ]; then
    print_error "Plan execution failed (HTTP $status)"
    echo "Response: $body"
    exit 1
  fi
  
  # Check for dry-run confirmation
  if command -v jq >/dev/null 2>&1; then
    local dry_run=$(echo "$body" | jq -r '.result.dryRun')
    if [ "$dry_run" = "true" ]; then
      print_success "Dry-run execution completed"
    else
      print_error "Dry-run flag not true in response"
      echo "Response: $body"
      exit 1
    fi
  else
    if echo "$body" | grep -q '"dryRun":true'; then
      print_success "Dry-run execution completed"
    else
      print_error "Dry-run flag not found in response"
      echo "Response: $body"
      exit 1
    fi
  fi
  
  echo ""
}

function verify_metrics() {
  echo "5. Verify Metrics"
  echo "----------------------------"
  
  local response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$API_URL/metrics")
  local body=$(echo "$response" | head -n -1)
  local status=$(echo "$response" | tail -n 1)
  
  if [ "$status" != "200" ]; then
    print_error "Metrics endpoint failed (HTTP $status)"
    echo "Response: $body"
    exit 1
  fi
  
  print_success "Metrics endpoint accessible"
  
  # Check for expected metrics structure
  if command -v jq >/dev/null 2>&1; then
    local planner=$(echo "$body" | jq -r '.metrics.planner')
    local execution=$(echo "$body" | jq -r '.metrics.execution')
    local quotas=$(echo "$body" | jq -r '.metrics.quotas')
    
    if [ "$planner" != "null" ]; then
      print_success "Planner metrics present"
    else
      print_warning "Planner metrics not found"
    fi
    
    if [ "$execution" != "null" ]; then
      print_success "Execution metrics present"
    else
      print_warning "Execution metrics not found"
    fi
    
    if [ "$quotas" != "null" ]; then
      print_success "Quota metrics present"
    else
      print_warning "Quota metrics not found"
    fi
  else
    if echo "$body" | grep -q '"planner"'; then
      print_success "Planner metrics present"
    else
      print_warning "Planner metrics not found"
    fi
    
    if echo "$body" | grep -q '"execution"'; then
      print_success "Execution metrics present"
    else
      print_warning "Execution metrics not found"
    fi
    
    if echo "$body" | grep -q '"quotas"'; then
      print_success "Quota metrics present"
    else
      print_warning "Quota metrics not found"
    fi
  fi
  
  echo ""
}

function verify_webhook() {
  echo "6. Verify Webhook Endpoint"
  echo "----------------------------"
  
  # Test webhook endpoint is accessible (should reject without signature)
  local response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
    -X POST "$API_URL/api/webhooks/whop" \
    -H "Content-Type: application/json" \
    -d '{"event":"test","data":{}}')
  
  local status=$(echo "$response" | tail -n 1)
  
  # We expect either 401 (signature required) or 200 (signature check disabled)
  if [ "$status" = "200" ] || [ "$status" = "401" ]; then
    print_success "Webhook endpoint accessible"
    if [ "$status" = "401" ]; then
      print_success "Webhook signature verification is enabled"
    else
      print_warning "Webhook signature verification appears disabled"
    fi
  else
    print_error "Webhook endpoint failed (HTTP $status)"
    exit 1
  fi
  
  echo ""
}

function cleanup() {
  echo "Cleanup"
  echo "----------------------------"
  
  if [ -f /tmp/validation-plan-id.txt ]; then
    rm /tmp/validation-plan-id.txt
    print_success "Temporary files cleaned up"
  fi
  
  echo ""
}

# Main execution
echo "Starting validation checks..."
echo ""

check_health
test_planner_dryrun
test_plan_approval
test_execute_draft
verify_metrics
verify_webhook
cleanup

echo "=================================="
print_success "All validation checks passed!"
echo "=================================="
echo ""
echo "Production system is operational and ready for use."
echo ""

exit 0
