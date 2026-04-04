#!/bin/bash

# Test script for Violess mobile user APIs
# Run this from backend directory: bash test-apis.sh

API_URL="http://localhost:5000"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test.user.${TIMESTAMP}@violess.test"
TEST_PASSWORD="TestPass123!"

echo "================================================"
echo "Violess Mobile User API Testing"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Register user
echo -e "${YELLOW}Test 1: Register Mobile User${NC}"
echo "URL: POST $API_URL/register-user"
echo "Email: $TEST_EMAIL"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/register-user" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"phone\": \"09123456789\",
    \"barangay\": \"Test Barangay\"
  }")

echo "Response:"
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# Extract UID from response
UID=$(echo "$REGISTER_RESPONSE" | jq -r '.uid' 2>/dev/null)

if [ "$UID" != "null" ] && [ ! -z "$UID" ]; then
  echo -e "${GREEN}✓ User registered successfully with UID: $UID${NC}"
  echo ""
else
  echo -e "${RED}✗ Failed to register user${NC}"
  echo ""
  exit 1
fi

# Test 2: Login user
echo -e "${YELLOW}Test 2: Login Mobile User${NC}"
echo "URL: POST $API_URL/login-user"
echo "Email: $TEST_EMAIL"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login-user" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Response:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

LOGIN_UID=$(echo "$LOGIN_RESPONSE" | jq -r '.uid' 2>/dev/null)

if [ "$LOGIN_UID" == "$UID" ]; then
  echo -e "${GREEN}✓ User logged in successfully${NC}"
  echo ""
else
  echo -e "${RED}✗ Failed to login user${NC}"
  echo ""
  exit 1
fi

# Test 3: Get user profile
echo -e "${YELLOW}Test 3: Get User Profile${NC}"
echo "URL: GET $API_URL/user/$UID"
echo ""

PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/user/$UID")

echo "Response:"
echo "$PROFILE_RESPONSE" | jq . 2>/dev/null || echo "$PROFILE_RESPONSE"
echo ""

PROFILE_UID=$(echo "$PROFILE_RESPONSE" | jq -r '.user.uid' 2>/dev/null)

if [ ! -z "$PROFILE_UID" ] || [ "$(echo "$PROFILE_RESPONSE" | jq -r '.success' 2>/dev/null)" == "true" ]; then
  echo -e "${GREEN}✓ User profile retrieved successfully${NC}"
  echo ""
else
  echo -e "${RED}✗ Failed to get user profile${NC}"
  echo ""
  exit 1
fi

# Test 4: Update user profile
echo -e "${YELLOW}Test 4: Update User Profile${NC}"
echo "URL: POST $API_URL/update-user"
echo "UID: $UID"
echo ""

UPDATE_RESPONSE=$(curl -s -X POST "$API_URL/update-user" \
  -H "Content-Type: application/json" \
  -d "{
    \"uid\": \"$UID\",
    \"firstName\": \"Updated\",
    \"lastName\": \"Name\",
    \"barangay\": \"Updated Barangay\"
  }")

echo "Response:"
echo "$UPDATE_RESPONSE" | jq . 2>/dev/null || echo "$UPDATE_RESPONSE"
echo ""

if [ "$(echo "$UPDATE_RESPONSE" | jq -r '.success' 2>/dev/null)" == "true" ]; then
  echo -e "${GREEN}✓ User profile updated successfully${NC}"
  echo ""
else
  echo -e "${RED}✗ Failed to update user profile${NC}"
  echo ""
  exit 1
fi

echo "================================================"
echo -e "${GREEN}All tests passed!${NC}"
echo "================================================"
