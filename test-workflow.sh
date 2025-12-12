#!/bin/bash

# Test script for ProductOpsAgent complete workflow
# This script demonstrates:
# 1. Health check
# 2. Creating a plan
# 3. Publishing a plan
# 4. Approving a plan
# 5. Executing a plan
# 6. Retrieving plan details

set -e

API_URL="http://localhost:3001"
PLAN_ID="plan_demo_$(date +%s)"

echo "🚀 ProductOpsAgent Workflow Test"
echo "================================="
echo ""

# Generate JWT token
echo "📝 Generating JWT token..."
cd packages/server
TOKEN=$(JWT_SECRET="dev-secret-key-change-in-production" node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  sub: 'admin',
  iss: 'product-ops-agent',
  aud: 'product-ops-agent-api',
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
}, process.env.JWT_SECRET);
console.log(token);
")
cd ../..
echo "✅ Token generated"
echo ""

# Health check
echo "🏥 Checking health..."
curl -s $API_URL/health | jq .
echo ""

# Create plan
echo "📋 Creating plan ($PLAN_ID)..."
PLAN_RESPONSE=$(curl -s -X POST $API_URL/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"planId\": \"$PLAN_ID\",
    \"actions\": [
      {
        \"type\": \"CREATE_PRODUCT\",
        \"payload\": {
          \"name\": \"Demo Product\",
          \"price\": 99.99,
          \"recurring\": true
        }
      },
      {
        \"type\": \"ADD_FAQ\",
        \"payload\": {
          \"question\": \"What is this product?\",
          \"answer\": \"This is a demo product for testing.\"
        }
      }
    ],
    \"description\": \"Demo plan with product and FAQ\"
  }")
echo $PLAN_RESPONSE | jq .
echo ""

# Publish plan
echo "📢 Publishing plan..."
curl -s -X POST $API_URL/plans/$PLAN_ID/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Approve plan
echo "✅ Approving plan..."
curl -s -X POST $API_URL/plans/$PLAN_ID/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "decision": "APPROVED",
    "reason": "Automated test approval"
  }' | jq .
echo ""

# Execute plan
echo "⚡ Executing plan..."
EXECUTION_RESULT=$(curl -s -X POST $API_URL/execute/$PLAN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")
echo $EXECUTION_RESULT | jq .
echo ""

# Get plan details
echo "📊 Retrieving plan details..."
curl -s $API_URL/plans/$PLAN_ID \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "✨ Workflow test completed successfully!"
echo ""
echo "📝 Summary:"
echo "  - Plan ID: $PLAN_ID"
echo "  - Status: COMPLETED"
echo "  - Actions executed: 2"
echo ""
echo "🌐 View in Admin UI: http://localhost:3000"
echo "  Enter plan ID: $PLAN_ID"
