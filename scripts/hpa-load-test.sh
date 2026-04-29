#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CodeView — HPA Load Test for execution-service
#
# This script stress-tests the execution-service to trigger Horizontal Pod
# Autoscaler scaling. It sends continuous code-execution requests and monitors
# the pod count increasing from 2 → N (up to 8).
#
# Usage:  bash scripts/hpa-load-test.sh
# Prereq: Services deployed via deploy.sh, metrics-server enabled
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

NAMESPACE="codeview"
LOAD_DURATION=${LOAD_DURATION:-180}           # seconds to run load (default 3 min)
MONITOR_INTERVAL=10                            # seconds between HPA checks
SCALE_DOWN_WAIT=${SCALE_DOWN_WAIT:-360}        # seconds to wait for scale-down (default 6 min)

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; }

LOAD_POD_NAME="hpa-load-generator"

cleanup() {
    info "Cleaning up load generator..."
    kubectl delete pod "$LOAD_POD_NAME" -n "$NAMESPACE" --ignore-not-found=true 2>/dev/null || true
}
trap cleanup EXIT

# ── 1. Pre-flight Checks ─────────────────────────────────────────────────────
info "Running pre-flight checks..."

# Check metrics-server
if kubectl top nodes >/dev/null 2>&1; then
    ok "metrics-server is working"
else
    fail "metrics-server is not providing metrics"
    echo "  Run: minikube addons enable metrics-server"
    echo "  Wait 1-2 minutes for it to start collecting data"
    exit 1
fi

# Check execution-service HPA exists
if kubectl get hpa execution-service-hpa -n "$NAMESPACE" >/dev/null 2>&1; then
    ok "execution-service-hpa found"
else
    fail "execution-service-hpa not found"
    echo "  Run: kubectl apply -f devops/k8s/execution-service/hpa.yaml"
    exit 1
fi

# ── 2. Show Initial State ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══ Initial State ═══${NC}"
kubectl get hpa execution-service-hpa -n "$NAMESPACE"
echo ""
INITIAL_REPLICAS=$(kubectl get deployment execution-service -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
info "Current replicas: ${INITIAL_REPLICAS}"
echo ""

# ── 3. Deploy Load Generator Pod ─────────────────────────────────────────────
info "Deploying CPU-intensive load generator pod..."

# Get execution-service ClusterIP
EXEC_SVC_IP=$(kubectl get svc execution-service -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
EXEC_SVC_PORT=5001

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: ${LOAD_POD_NAME}
  namespace: ${NAMESPACE}
  labels:
    app: load-generator
spec:
  containers:
    - name: load-gen
      image: busybox:1.36
      command:
        - /bin/sh
        - -c
        - |
          echo "Starting load generator against execution-service..."
          echo "Target: http://${EXEC_SVC_IP}:${EXEC_SVC_PORT}"
          # Send continuous requests to overwhelm the execution-service CPU
          while true; do
            # Send 10 parallel requests
            for i in \$(seq 1 10); do
              wget -q -O /dev/null --timeout=30 \
                --post-data='{"userId":"load-test","problemId":"load-test","language":"python","sourceCode":"import time\\nfor i in range(10000000):\\n    x = i**2\\nprint(42)","testCases":[{"input":"","expectedOutput":"42"}],"username":"LoadTest","problemTitle":"CPU Stress"}' \
                --header="Content-Type: application/json" \
                "http://${EXEC_SVC_IP}:${EXEC_SVC_PORT}/api/submissions" 2>/dev/null &
            done
            wait
            sleep 1
          done
      resources:
        requests:
          cpu: "50m"
          memory: "32Mi"
        limits:
          cpu: "100m"
          memory: "64Mi"
  restartPolicy: Never
EOF

# Wait for pod to be running
info "Waiting for load generator pod to start..."
kubectl wait --for=condition=Ready pod/"$LOAD_POD_NAME" -n "$NAMESPACE" --timeout=60s
ok "Load generator is running"

# ── 4. Monitor HPA Scaling ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══ Monitoring HPA Scaling (${LOAD_DURATION}s) ═══${NC}"
echo -e "${YELLOW}Watching execution-service-hpa... Press Ctrl+C to stop early${NC}"
echo ""

MAX_REPLICAS=0
SCALED_UP=false
ELAPSED=0

while [ "$ELAPSED" -lt "$LOAD_DURATION" ]; do
    TIMESTAMP=$(date '+%H:%M:%S')
    
    # Get current HPA values
    HPA_LINE=$(kubectl get hpa execution-service-hpa -n "$NAMESPACE" --no-headers 2>/dev/null || echo "N/A")
    CURRENT_REPLICAS=$(kubectl get deployment execution-service -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "?")
    DESIRED_REPLICAS=$(kubectl get hpa execution-service-hpa -n "$NAMESPACE" -o jsonpath='{.status.desiredReplicas}' 2>/dev/null || echo "?")
    
    # Get CPU usage
    CPU_METRIC=$(kubectl get hpa execution-service-hpa -n "$NAMESPACE" -o jsonpath='{.status.currentMetrics[0].resource.current.averageUtilization}' 2>/dev/null || echo "?")
    
    # Track max replicas
    if [[ "$CURRENT_REPLICAS" =~ ^[0-9]+$ ]] && [ "$CURRENT_REPLICAS" -gt "$MAX_REPLICAS" ]; then
        MAX_REPLICAS=$CURRENT_REPLICAS
    fi
    
    if [[ "$CURRENT_REPLICAS" =~ ^[0-9]+$ ]] && [ "$CURRENT_REPLICAS" -gt "${INITIAL_REPLICAS:-2}" ]; then
        SCALED_UP=true
    fi
    
    # Print status
    if [ "$SCALED_UP" = true ]; then
        echo -e "  ${GREEN}[${TIMESTAMP}]${NC} Replicas: ${GREEN}${CURRENT_REPLICAS}${NC}/${DESIRED_REPLICAS} | CPU: ${CPU_METRIC}% | ${GREEN}SCALED UP ⬆${NC}"
    else
        echo -e "  ${CYAN}[${TIMESTAMP}]${NC} Replicas: ${CURRENT_REPLICAS}/${DESIRED_REPLICAS} | CPU: ${CPU_METRIC}% | Waiting for scale-up..."
    fi
    
    sleep "$MONITOR_INTERVAL"
    ELAPSED=$((ELAPSED + MONITOR_INTERVAL))
done

# ── 5. Stop Load Generator ───────────────────────────────────────────────────
echo ""
info "Stopping load generator..."
kubectl delete pod "$LOAD_POD_NAME" -n "$NAMESPACE" --ignore-not-found=true 2>/dev/null || true
ok "Load generator stopped"

# ── 6. Scale-Up Results ──────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══ Scale-Up Results ═══${NC}"
if [ "$SCALED_UP" = true ]; then
    ok "HPA successfully scaled execution-service from ${INITIAL_REPLICAS} to ${MAX_REPLICAS} replicas!"
else
    warn "HPA did not scale up during the test period."
    echo "  Possible reasons:"
    echo "    - metrics-server needs more time to collect CPU data"
    echo "    - CPU usage didn't exceed the 65% threshold"
    echo "    - Try increasing LOAD_DURATION: LOAD_DURATION=300 bash scripts/hpa-load-test.sh"
fi
echo ""

# ── 7. Monitor Scale-Down ────────────────────────────────────────────────────
echo -e "${BOLD}═══ Monitoring Scale-Down (${SCALE_DOWN_WAIT}s) ═══${NC}"
echo -e "${YELLOW}Watching replicas decrease back to ${INITIAL_REPLICAS}...${NC}"
echo ""

ELAPSED=0
SCALED_DOWN=false

while [ "$ELAPSED" -lt "$SCALE_DOWN_WAIT" ]; do
    TIMESTAMP=$(date '+%H:%M:%S')
    CURRENT_REPLICAS=$(kubectl get deployment execution-service -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "?")
    CPU_METRIC=$(kubectl get hpa execution-service-hpa -n "$NAMESPACE" -o jsonpath='{.status.currentMetrics[0].resource.current.averageUtilization}' 2>/dev/null || echo "?")
    
    echo -e "  ${CYAN}[${TIMESTAMP}]${NC} Replicas: ${CURRENT_REPLICAS} | CPU: ${CPU_METRIC}%"
    
    if [[ "$CURRENT_REPLICAS" =~ ^[0-9]+$ ]] && [ "$CURRENT_REPLICAS" -le "${INITIAL_REPLICAS:-2}" ]; then
        SCALED_DOWN=true
        break
    fi
    
    sleep "$MONITOR_INTERVAL"
    ELAPSED=$((ELAPSED + MONITOR_INTERVAL))
done

# ── 8. Final Summary ─────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  HPA Load Test Summary${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Initial replicas:     ${INITIAL_REPLICAS}"
echo -e "  Max replicas reached: ${MAX_REPLICAS}"
FINAL_REPLICAS=$(kubectl get deployment execution-service -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "?")
echo -e "  Current replicas:     ${FINAL_REPLICAS}"

if [ "$SCALED_UP" = true ]; then
    echo -e "  Scale-up:             ${GREEN}SUCCESS ✅${NC}"
else
    echo -e "  Scale-up:             ${YELLOW}NOT OBSERVED ⚠️${NC}"
fi

if [ "$SCALED_DOWN" = true ]; then
    echo -e "  Scale-down:           ${GREEN}SUCCESS ✅${NC}"
else
    echo -e "  Scale-down:           ${YELLOW}STILL IN PROGRESS (stabilization window)${NC}"
fi

echo ""
echo -e "  ${YELLOW}Current HPA Status:${NC}"
kubectl get hpa -n "$NAMESPACE"
echo ""
echo -e "  ${YELLOW}Current Pods:${NC}"
kubectl get pods -n "$NAMESPACE" -l app=execution-service
echo ""
