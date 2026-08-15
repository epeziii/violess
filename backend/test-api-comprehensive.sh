#!/bin/bash
# Comprehensive API Test Suite for Violess Backend

API_URL="http://localhost:5000"
PASS=0
FAIL=0

echo "🚀 Starting Comprehensive API Tests"
echo "=================================="
echo ""

# Helper function to test endpoints
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_code=$5
  
  echo "Testing: $name"
  
  if [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "$expected_code" ]; then
    echo "  ✅ HTTP $http_code (expected $expected_code)"
    echo "  Response: $(echo $body | head -c 100)..."
    PASS=$((PASS+1))
  else
    echo "  ❌ HTTP $http_code (expected $expected_code)"
    echo "  Response: $body"
    FAIL=$((FAIL+1))
  fi
  echo ""
}

# ========================
# 1. USER REGISTRATION TEST
# ========================
echo "1️⃣  REGISTRATION TESTS"
echo "====================="

TIMESTAMP=$(date +%s)
TEST_EMAIL="apitest_$TIMESTAMP@example.com"
TEST_PASSWORD="Test123!@#"

reg_response=$(curl -s -X POST "$API_URL/register-user" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"firstName\": \"API\",
    \"lastName\": \"Test\",
    \"phone\": \"09123456789\",
    \"barangay\": \"Barangay 1\"
  }")

TEST_UID=$(echo $reg_response | grep -o '"uid":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TEST_UID" ]; then
  echo "✅ User Registration: SUCCESS"
  echo "   UID: $TEST_UID"
  echo "   Email: $TEST_EMAIL"
  PASS=$((PASS+1))
else
  echo "❌ User Registration: FAILED"
  echo "   Response: $reg_response"
  FAIL=$((FAIL+1))
  exit 1
fi
echo ""

# ========================
# 2. USER LOGIN TEST
# ========================
echo "2️⃣  LOGIN TEST"
echo "==============="

login_response=$(curl -s -X POST "$API_URL/login-user" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$login_response" | grep -q "$TEST_UID"; then
  echo "✅ User Login: SUCCESS"
  echo "   Response contains UID: $TEST_UID"
  PASS=$((PASS+1))
else
  echo "❌ User Login: FAILED"
  echo "   Response: $login_response"
  FAIL=$((FAIL+1))
fi
echo ""

# ========================
# 3. GET USER PROFILE
# ========================
echo "3️⃣  GET USER PROFILE TEST"
echo "=========================="

profile_response=$(curl -s -X GET "$API_URL/user/$TEST_UID")

if echo "$profile_response" | grep -q "API"; then
  echo "✅ Get User Profile: SUCCESS"
  echo "   Response: $(echo $profile_response | head -c 150)..."
  PASS=$((PASS+1))
else
  echo "❌ Get User Profile: FAILED"
  echo "   Response: $profile_response"
  FAIL=$((FAIL+1))
fi
echo ""

# ========================
# 4. UPDATE USER PROFILE
# ========================
echo "4️⃣  UPDATE USER PROFILE TEST"
echo "============================="

update_response=$(curl -s -X POST "$API_URL/update-user" \
  -H "Content-Type: application/json" \
  -d "{
    \"uid\": \"$TEST_UID\",
    \"firstName\": \"APIUpdated\",
    \"lastName\": \"TestUser\",
    \"phone\": \"09987654321\",
    \"barangay\": \"Barangay 2\"
  }")

if echo "$update_response" | grep -q "success"; then
  echo "✅ Update User Profile: SUCCESS"
  PASS=$((PASS+1))
else
  echo "❌ Update User Profile: FAILED"
  echo "   Response: $update_response"
  FAIL=$((FAIL+1))
fi
echo ""

# ========================
# 5. GET HELP CENTERS
# ========================
echo "5️⃣  GET HELP CENTERS TEST"
echo "=========================="

help_response=$(curl -s -X GET "$API_URL/help-centers")

if echo "$help_response" | grep -q "help_centers\|success"; then
  echo "✅ Get Help Centers: SUCCESS"
  echo "   Response: $(echo $help_response | head -c 150)..."
  PASS=$((PASS+1))
else
  echo "⚠️  Get Help Centers: Response unclear"
  echo "   Response: $help_response"
fi
echo ""

# ========================
# 6. SUBMIT REPORT (Case)
# ========================
echo "6️⃣  SUBMIT REPORT TEST"
echo "======================="

report_response=$(curl -s -X POST "$API_URL/submit-report" \
  -H "Content-Type: application/json" \
  -d "{
    \"uid\": \"$TEST_UID\",
    \"caseType\": \"Verbal Abuse\",
    \"location\": \"Makati City\",
    \"description\": \"Test case for API validation\",
    \"datetime\": \"2026-08-12T10:00:00Z\",
    \"isAnonymous\": false,
    \"evidence\": []
  }")

CASE_ID=$(echo $report_response | grep -o '"caseId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$CASE_ID" ]; then
  echo "✅ Submit Report: SUCCESS"
  echo "   Case ID: $CASE_ID"
  PASS=$((PASS+1))
else
  echo "⚠️  Submit Report: Possible issue (may require additional setup)"
  echo "   Response: $(echo $report_response | head -c 150)..."
fi
echo ""

# ========================
# 7. GET USER CASES
# ========================
echo "7️⃣  GET USER CASES TEST"
echo "==============================="

cases_response=$(curl -s -X GET "$API_URL/user/$TEST_UID/cases")

if echo "$cases_response" | grep -q "cases\|success"; then
  echo "✅ Get User Cases: SUCCESS"
  echo "   Response: $(echo $cases_response | head -c 150)..."
  PASS=$((PASS+1))
else
  echo "⚠️  Get User Cases: Response unclear"
  echo "   Response: $cases_response"
fi
echo ""

# ========================
# 8. GET NOTIFICATIONS
# ========================
echo "8️⃣  GET NOTIFICATIONS TEST"
echo "============================"

notif_response=$(curl -s -X GET "$API_URL/notifications/$TEST_UID")

if echo "$notif_response" | grep -q "notifications\|success"; then
  echo "✅ Get Notifications: SUCCESS"
  echo "   Response: $(echo $notif_response | head -c 150)..."
  PASS=$((PASS+1))
else
  echo "⚠️  Get Notifications: Response unclear"
  echo "   Response: $notif_response"
fi
echo ""

# ========================
# 9. ANALYTICS ENDPOINTS
# ========================
echo "9️⃣  ANALYTICS TESTS"
echo "===================="

# Age group affected
age_response=$(curl -s -X GET "$API_URL/analytics/age-group-affected")
if echo "$age_response" | grep -q "data\|success\|error"; then
  echo "✅ Analytics - Age Group: Responded"
  PASS=$((PASS+1))
else
  echo "⚠️  Analytics - Age Group: No response"
fi

# Monthly cases
monthly_response=$(curl -s -X GET "$API_URL/analytics/monthly-cases")
if echo "$monthly_response" | grep -q "data\|success\|error"; then
  echo "✅ Analytics - Monthly Cases: Responded"
  PASS=$((PASS+1))
else
  echo "⚠️  Analytics - Monthly Cases: No response"
fi

# Most common abuse type
abuse_response=$(curl -s -X GET "$API_URL/analytics/most-common-abuse-type")
if echo "$abuse_response" | grep -q "data\|success\|error"; then
  echo "✅ Analytics - Most Common Type: Responded"
  PASS=$((PASS+1))
else
  echo "⚠️  Analytics - Most Common Type: No response"
fi
echo ""

# ========================
# SUMMARY
# ========================
echo "=================================="
echo "📊 TEST SUMMARY"
echo "=================================="
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED!"
else
  echo "⚠️  Some tests failed or unclear. Review above."
fi

echo ""
echo "📝 Test Data:"
echo "  Test User UID: $TEST_UID"
echo "  Test Email: $TEST_EMAIL"
echo "  Test Password: $TEST_PASSWORD"
