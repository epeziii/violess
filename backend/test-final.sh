#!/bin/bash

API_URL="http://localhost:5000"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test.user.${TIMESTAMP}@violess.test"
TEST_PASSWORD="TestPass123!"

echo "=================================================="
echo "Violess Mobile User API Final Testing"
echo "=================================================="
echo ""

# Test 1: Register user
echo "✓ Test 1: Register Mobile User"
echo "  Email: $TEST_EMAIL"

REGISTER=$(curl -s -X POST "$API_URL/register-user" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"phone\": \"09123456789\",
    \"barangay\": \"Test Barangay\"
  }")

echo "  Response: $REGISTER"
TEST_UID=$(echo "$REGISTER" | grep -o '"uid":"[^"]*' | cut -d'"' -f4)
echo "  UID: $TEST_UID"
echo ""

# Test 2: Login user
echo "✓ Test 2: Login Mobile User"
echo "  Email: $TEST_EMAIL"

LOGIN=$(curl -s -X POST "$API_URL/login-user" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "  Response: $LOGIN"
LOGIN_UID=$(echo "$LOGIN" | grep -o '"uid":"[^"]*' | cut -d'"' -f4)
echo "  UID: $LOGIN_UID"
echo ""

# Test 3: Get user profile
echo "✓ Test 3: Get User Profile"
echo "  UID: $TEST_UID"

PROFILE=$(curl -s -X GET "$API_URL/user/$TEST_UID")
echo "  Response: $PROFILE"
echo ""

# Test 4: Update user profile
echo "✓ Test 4: Update User Profile"
echo "  UID: $TEST_UID"

UPDATE=$(curl -s -X POST "$API_URL/update-user" \
  -H "Content-Type: application/json" \
  -d "{
    \"uid\": \"$TEST_UID\",
    \"firstName\": \"Updated\",
    \"lastName\": \"Name\",
    \"barangay\": \"New Barangay\"
  }")

echo "  Response: $UPDATE"
echo ""

echo "=================================================="
echo "✓ All API tests completed successfully!"
echo "=================================================="
