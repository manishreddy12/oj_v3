#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CodeView — Full Minikube Deployment Script
#
# Usage:  bash scripts/deploy.sh
# Prereq: Docker, Minikube, kubectl installed
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$PROJECT_ROOT/devops/k8s"
NAMESPACE="codeview"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

# ── 1. Prerequisites ─────────────────────────────────────────────────────────
info "Checking prerequisites..."
command -v docker   >/dev/null 2>&1 || fail "Docker is not installed"
command -v minikube >/dev/null 2>&1 || fail "Minikube is not installed"
command -v kubectl  >/dev/null 2>&1 || fail "kubectl is not installed"
ok "All prerequisites found"

# ── 2. Start Minikube ─────────────────────────────────────────────────────────
if minikube status --format='{{.Host}}' 2>/dev/null | grep -q "Running"; then
    ok "Minikube is already running"
else
    info "Starting Minikube with Docker driver..."
    minikube start \
        --driver=docker \
        --cpus=4 \
        --memory=6144 \
        --disk-size=20g
    ok "Minikube started"
fi

# ── 3. Enable Required Addons ────────────────────────────────────────────────
info "Enabling Minikube addons..."
minikube addons enable metrics-server 2>/dev/null || true
minikube addons enable ingress        2>/dev/null || true
ok "Addons enabled (metrics-server, ingress)"

# ── 4. Point Docker to Minikube's Daemon ─────────────────────────────────────
info "Pointing Docker CLI to Minikube's daemon..."
eval $(minikube docker-env)
ok "Docker now builds directly into Minikube"

# ── 5. Build Docker Images ──────────────────────────────────────────────────
info "Building Docker images (this may take a few minutes)..."

MINIKUBE_IP=$(minikube ip)

info "  → Building api-service..."
docker build \
    -f "$PROJECT_ROOT/api-service/Dockerfile" \
    -t codeview-api:latest \
    "$PROJECT_ROOT"

info "  → Building execution-service..."
docker build \
    -f "$PROJECT_ROOT/execution-service/Dockerfile" \
    -t codeview-execution:latest \
    "$PROJECT_ROOT"

info "  → Building frontend..."
docker build \
    -f "$PROJECT_ROOT/frontend/Dockerfile" \
    --build-arg VITE_API_URL="http://codeview.local" \
    -t codeview-frontend:latest \
    "$PROJECT_ROOT"

ok "All Docker images built"

# ── 6. Deploy MongoDB & Redis Inside Minikube ────────────────────────────────
info "Deploying MongoDB and Redis into Minikube..."

# Create namespace first
kubectl apply -f "$K8S_DIR/namespace.yaml"

# MongoDB deployment
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongo
  namespace: codeview
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongo
  template:
    metadata:
      labels:
        app: mongo
    spec:
      containers:
        - name: mongo
          image: mongo:7
          ports:
            - containerPort: 27017
          volumeMounts:
            - name: mongo-data
              mountPath: /data/db
      volumes:
        - name: mongo-data
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: mongo
  namespace: codeview
spec:
  selector:
    app: mongo
  ports:
    - port: 27017
      targetPort: 27017
EOF

# Redis deployment
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: codeview
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          command: ["redis-server", "--save", "60", "1", "--loglevel", "warning"]
          ports:
            - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: codeview
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
EOF

ok "MongoDB and Redis deployed"

# ── 7. Update Image References in Deployment YAMLs ──────────────────────────
# We use local images (no DockerHub), so patch the imagePullPolicy and image name
info "Applying K8s manifests..."

# Secrets and ConfigMaps
kubectl apply -f "$K8S_DIR/api-service/secret.yaml"
kubectl apply -f "$K8S_DIR/api-service/configmap.yaml"
kubectl apply -f "$K8S_DIR/execution-service/secret.yaml"
kubectl apply -f "$K8S_DIR/execution-service/configmap.yaml"

# Update the secrets to point to in-cluster MongoDB and Redis
kubectl create secret generic api-service-secret \
    --namespace="$NAMESPACE" \
    --from-literal=MONGO_URI="mongodb://mongo:27017/online_judge" \
    --from-literal=REDIS_URL="redis://redis-service:6379" \
    --from-literal=JWT_SECRET="dev_secret_change_in_prod_32chars" \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic execution-service-secret \
    --namespace="$NAMESPACE" \
    --from-literal=MONGO_URI="mongodb://mongo:27017/online_judge" \
    --dry-run=client -o yaml | kubectl apply -f -

# Apply deployments with patched images (local, no DockerHub prefix)
# API Service
kubectl apply -f "$K8S_DIR/api-service/deployment.yaml"
kubectl set image deployment/api-service \
    api-service=codeview-api:latest \
    -n "$NAMESPACE"
kubectl patch deployment api-service -n "$NAMESPACE" \
    -p '{"spec":{"template":{"spec":{"containers":[{"name":"api-service","imagePullPolicy":"Never"}]}}}}'

# Execution Service
kubectl apply -f "$K8S_DIR/execution-service/deployment.yaml"
kubectl set image deployment/execution-service \
    execution-service=codeview-execution:latest \
    -n "$NAMESPACE"
kubectl patch deployment execution-service -n "$NAMESPACE" \
    -p '{"spec":{"template":{"spec":{"containers":[{"name":"execution-service","imagePullPolicy":"Never"}]}}}}'

# Frontend
kubectl apply -f "$K8S_DIR/frontend/deployment.yaml"
kubectl set image deployment/frontend \
    frontend=codeview-frontend:latest \
    -n "$NAMESPACE"
kubectl patch deployment frontend -n "$NAMESPACE" \
    -p '{"spec":{"template":{"spec":{"containers":[{"name":"frontend","imagePullPolicy":"Never"}]}}}}'

# Services
kubectl apply -f "$K8S_DIR/api-service/service.yaml"
kubectl apply -f "$K8S_DIR/execution-service/service.yaml"
kubectl apply -f "$K8S_DIR/frontend/service.yaml"

# HPAs
kubectl apply -f "$K8S_DIR/api-service/hpa.yaml"
kubectl apply -f "$K8S_DIR/execution-service/hpa.yaml"

# Ingress
kubectl apply -f "$K8S_DIR/ingress.yaml"

ok "All K8s manifests applied"

# ── 8. Wait for Rollouts ─────────────────────────────────────────────────────
info "Waiting for deployments to be ready..."

kubectl rollout status deployment/mongo           -n "$NAMESPACE" --timeout=120s
kubectl rollout status deployment/redis           -n "$NAMESPACE" --timeout=120s
kubectl rollout status deployment/api-service     -n "$NAMESPACE" --timeout=180s
kubectl rollout status deployment/execution-service -n "$NAMESPACE" --timeout=180s
kubectl rollout status deployment/frontend        -n "$NAMESPACE" --timeout=120s

ok "All deployments are ready"

# ── 9. Update /etc/hosts ─────────────────────────────────────────────────────
if ! grep -q "codeview.local" /etc/hosts 2>/dev/null; then
    warn "Adding codeview.local to /etc/hosts (requires sudo)..."
    echo "$MINIKUBE_IP codeview.local" | sudo tee -a /etc/hosts >/dev/null
    ok "Added codeview.local → $MINIKUBE_IP to /etc/hosts"
else
    ok "codeview.local already in /etc/hosts"
fi

# ── 10. Print Summary ────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  CodeView deployed successfully to Minikube!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Minikube IP:       ${CYAN}${MINIKUBE_IP}${NC}"
echo -e "  Frontend:          ${CYAN}http://codeview.local${NC}  (via Ingress)"
echo -e "  Frontend NodePort: ${CYAN}http://${MINIKUBE_IP}:30080${NC}"
echo -e "  API (via Ingress): ${CYAN}http://codeview.local/api/health${NC}"
echo ""
echo -e "  ${YELLOW}Pod Status:${NC}"
kubectl get pods -n "$NAMESPACE" -o wide
echo ""
echo -e "  ${YELLOW}Services:${NC}"
kubectl get svc -n "$NAMESPACE"
echo ""
echo -e "  ${YELLOW}HPAs:${NC}"
kubectl get hpa -n "$NAMESPACE"
echo ""
echo -e "  ${YELLOW}Next Steps:${NC}"
echo -e "    1. Test services: ${CYAN}bash scripts/test-services.sh${NC}"
echo -e "    2. Test HPA:      ${CYAN}bash scripts/hpa-load-test.sh${NC}"
echo -e "    3. Cleanup:       ${CYAN}bash scripts/cleanup.sh${NC}"
echo ""
