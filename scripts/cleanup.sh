#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CodeView — Cleanup / Teardown Script
#
# Usage:
#   bash scripts/cleanup.sh           # delete namespace only
#   bash scripts/cleanup.sh --full    # also stop Minikube + prune images
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

NAMESPACE="codeview"
FULL_CLEANUP=false

if [[ "${1:-}" == "--full" ]]; then
    FULL_CLEANUP=true
fi

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }

# ── 1. Delete Kubernetes Resources ───────────────────────────────────────────
info "Deleting codeview namespace and all resources..."
kubectl delete namespace "$NAMESPACE" --ignore-not-found=true --timeout=120s
ok "Namespace '$NAMESPACE' deleted"

# Delete ELK namespace if present
if kubectl get namespace logging >/dev/null 2>&1; then
    info "Deleting logging namespace..."
    kubectl delete namespace logging --ignore-not-found=true --timeout=60s
    ok "Namespace 'logging' deleted"
fi

# Delete any leftover HPA load generator
kubectl delete pod hpa-load-generator -n "$NAMESPACE" --ignore-not-found=true 2>/dev/null || true

# ── 2. Remove /etc/hosts entry ───────────────────────────────────────────────
if grep -q "codeview.local" /etc/hosts 2>/dev/null; then
    info "Removing codeview.local from /etc/hosts (requires sudo)..."
    sudo sed -i '/codeview.local/d' /etc/hosts
    ok "Removed codeview.local from /etc/hosts"
fi

# ── 3. Full Cleanup (optional) ───────────────────────────────────────────────
if [ "$FULL_CLEANUP" = true ]; then
    info "Full cleanup requested..."
    
    # Clean Docker images
    info "Pruning Docker images..."
    docker image rm codeview-api:latest codeview-execution:latest codeview-frontend:latest 2>/dev/null || true
    docker image prune -f 2>/dev/null || true
    ok "Docker images cleaned"
    
    # Stop Minikube
    info "Stopping Minikube..."
    minikube stop
    ok "Minikube stopped"
else
    echo ""
    info "Partial cleanup done. Minikube is still running."
    echo -e "  To fully stop everything: ${CYAN}bash scripts/cleanup.sh --full${NC}"
fi

echo ""
echo -e "${GREEN}Cleanup complete! ✅${NC}"
echo ""
