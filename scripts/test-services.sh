#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CodeView — Post-Deployment Service Tests
#
# Usage:  bash scripts/test-services.sh
# Prereq: Services deployed via deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

NAMESPACE="codeview"
API_LOCAL_PORT=8099
EXEC_LOCAL_PORT=8098
PASSED=0
FAILED=0
PF_PIDS=()

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[PASS]${NC}  $*"; PASSED=$((PASSED + 1)); }
fail_t(){ echo -e "${RED}[FAIL]${NC}  $*"; FAILED=$((FAILED + 1)); }

cleanup() {
    info "Cleaning up port-forwards..."
    for pid in "${PF_PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
}
trap cleanup EXIT

# ── 1. Check Pods Are Running ─────────────────────────────────────────────────
info "Checking pod status..."
NOT_READY=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null | grep -v "Running" | grep -v "Completed" || true)
if [ -n "$NOT_READY" ]; then
    fail_t "Some pods are not running:"
    echo "$NOT_READY"
else
    ok "All pods are in Running state"
fi

# ── 2. Port-Forward Services ─────────────────────────────────────────────────
info "Setting up port-forwards..."

kubectl port-forward svc/api-service "$API_LOCAL_PORT":5000 -n "$NAMESPACE" &
PF_PIDS+=($!)

kubectl port-forward svc/execution-service "$EXEC_LOCAL_PORT":5001 -n "$NAMESPACE" &
PF_PIDS+=($!)

# Wait for port-forwards to establish
sleep 5
info "Port-forwards ready (API → :${API_LOCAL_PORT}, Exec → :${EXEC_LOCAL_PORT})"

API_URL="http://localhost:${API_LOCAL_PORT}"
EXEC_URL="http://localhost:${EXEC_LOCAL_PORT}"

# ── 3. API Service Health Check ──────────────────────────────────────────────
info "Testing API Service..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    ok "API /api/health → 200"
else
    fail_t "API /api/health → $HTTP_CODE (expected 200)"
fi

# Test /api/problems
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/problems" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    ok "API /api/problems → 200"
else
    fail_t "API /api/problems → $HTTP_CODE (expected 200)"
fi

# Test /api/contests
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/contests" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    ok "API /api/contests → 200"
else
    fail_t "API /api/contests → $HTTP_CODE (expected 200)"
fi

# Test 404
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/nonexistent" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "404" ]; then
    ok "API /api/nonexistent → 404 (correct)"
else
    fail_t "API /api/nonexistent → $HTTP_CODE (expected 404)"
fi

# ── 4. Execution Service Health Check ────────────────────────────────────────
info "Testing Execution Service..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$EXEC_URL/api/health" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    ok "Exec /api/health → 200"
else
    fail_t "Exec /api/health → $HTTP_CODE (expected 200)"
fi

# ── 5. Code Submission Test ──────────────────────────────────────────────────
info "Testing code submission (Python: n*2)..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$EXEC_URL/api/submissions" \
    -H "Content-Type: application/json" \
    -d '{
        "userId": "test-user",
        "problemId": "test-problem",
        "language": "python",
        "sourceCode": "n = int(input())\nprint(n * 2)",
        "testCases": [{"input": "5", "expectedOutput": "10"}],
        "username": "TestUser",
        "problemTitle": "Test Problem"
    }' 2>/dev/null || echo -e "\n000")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
    STATUS=$(echo "$BODY" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$STATUS" = "Accepted" ]; then
        ok "Code submission → 201, verdict: Accepted"
    else
        fail_t "Code submission → 201 but verdict: $STATUS (expected Accepted)"
    fi
else
    fail_t "Code submission → $HTTP_CODE (expected 201)"
fi

# ── 6. Wrong Answer Test ─────────────────────────────────────────────────────
info "Testing wrong answer submission..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$EXEC_URL/api/submissions" \
    -H "Content-Type: application/json" \
    -d '{
        "userId": "test-user",
        "problemId": "test-problem",
        "language": "python",
        "sourceCode": "n = int(input())\nprint(n + 1)",
        "testCases": [{"input": "5", "expectedOutput": "10"}],
        "username": "TestUser",
        "problemTitle": "Test Problem"
    }' 2>/dev/null || echo -e "\n000")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
    STATUS=$(echo "$BODY" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$STATUS" = "Wrong Answer" ]; then
        ok "Wrong answer submission → 201, verdict: Wrong Answer"
    else
        fail_t "Wrong answer submission → 201 but verdict: $STATUS (expected Wrong Answer)"
    fi
else
    fail_t "Wrong answer submission → $HTTP_CODE (expected 201)"
fi

# ── 7. Frontend Test ─────────────────────────────────────────────────────────
info "Testing Frontend..."

FRONTEND_URL=$(minikube service frontend-service -n "$NAMESPACE" --url 2>/dev/null || echo "")
if [ -n "$FRONTEND_URL" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        ok "Frontend → 200 at $FRONTEND_URL"
    else
        fail_t "Frontend → $HTTP_CODE at $FRONTEND_URL"
    fi
else
    warn "Could not get frontend URL (ingress may still be setting up)"
fi

# ── 8. HPA Check ─────────────────────────────────────────────────────────────
info "Checking HPA resources..."

HPA_COUNT=$(kubectl get hpa -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l)
if [ "$HPA_COUNT" -ge 2 ]; then
    ok "Found $HPA_COUNT HPA resources"
else
    fail_t "Expected at least 2 HPAs, found $HPA_COUNT"
fi

# ── 9. Run Jest Smoke Tests (if available) ───────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_ROOT/tests/package.json" ]; then
    info "Running Jest smoke tests..."
    cd "$PROJECT_ROOT/tests"
    if [ ! -d "node_modules" ]; then
        npm install --silent 2>/dev/null
    fi
    API_URL="$API_URL" EXEC_URL="$EXEC_URL" \
        npx jest deployment-smoke.test.js --forceExit --passWithNoTests 2>&1 && \
        ok "Jest smoke tests passed" || \
        fail_t "Jest smoke tests failed"
    cd "$PROJECT_ROOT"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
TOTAL=$((PASSED + FAILED))
echo -e "  Tests: ${GREEN}${PASSED} passed${NC}, ${RED}${FAILED} failed${NC}, ${TOTAL} total"
if [ "$FAILED" -eq 0 ]; then
    echo -e "  ${GREEN}All tests passed! ✅${NC}"
else
    echo -e "  ${RED}Some tests failed ❌${NC}"
fi
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

exit "$FAILED"
