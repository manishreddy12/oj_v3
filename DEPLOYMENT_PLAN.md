# CodeView — Production Deployment Plan (Task 2)

> **Status:** Reference document — not yet executed.  
> **Architecture:** Frontend → Vercel | API → Render | Execution → AWS EC2 (ECR) | DB → MongoDB Atlas

---

## Architecture Overview

```
Browser
  │
  ├─► Vercel (Frontend React/Vite)
  │       │  VITE_API_URL points to Render
  │       │
  ├─► Render (api-service, Node.js)
  │       │  Reads/writes MongoDB Atlas
  │       │  Calls execution-service over HTTPS
  │       │
  └─► AWS EC2 (execution-service, Docker from ECR)
          │  Reads/writes MongoDB Atlas
          │  Runs compiler jobs in-process

MongoDB Atlas (free M0 cluster, shared)
```

---

## Phase 1 — MongoDB Atlas Setup

### Steps
1. Create account at cloud.mongodb.com
2. Create a free **M0 cluster** (512 MB storage, shared)
3. Under **Database Access**: create user `codeview_app` with password → save it
4. Under **Network Access**: add `0.0.0.0/0` (for Render/EC2 dynamic IPs) OR pin Render/EC2 IPs if they're static
5. Get connection string:  
   `mongodb+srv://codeview_app:<password>@cluster0.xxxxx.mongodb.net/online_judge?retryWrites=true&w=majority`

### Notes to avoid mistakes
- **Do NOT** use `0.0.0.0/0` long-term if the cluster has sensitive data — pin IPs once known
- M0 limits: 500 connections max, 100 ops/sec — fine for demo, not for load testing
- Enable **Atlas monitoring** dashboards for query performance insights
- The `online_judge` database name must match `MONGO_URI` in both services

---

## Phase 2 — Execution Service on AWS Free-Tier EC2 + ECR

### 2a. ECR Repository
```bash
# On your local machine (AWS CLI configured)
aws ecr create-repository --repository-name codeview-execution --region ap-south-1
# Note the repositoryUri: 123456789.dkr.ecr.ap-south-1.amazonaws.com/codeview-execution

# Build and push
cd OJ_Pre
docker build -f execution-service/Dockerfile -t codeview-execution .
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.ap-south-1.amazonaws.com
docker tag codeview-execution:latest 123456789.dkr.ecr.ap-south-1.amazonaws.com/codeview-execution:latest
docker push 123456789.dkr.ecr.ap-south-1.amazonaws.com/codeview-execution:latest
```

### 2b. EC2 Instance Setup
- **Instance type**: t2.micro (free tier) — 1 vCPU, 1 GB RAM
- **AMI**: Ubuntu 22.04 LTS
- **Security Group inbound rules**:
  - Port 5001 (TCP) — source: Render's IP range or `0.0.0.0/0` for now
  - Port 22 (SSH) — source: your IP only
- **Elastic IP**: Assign one so the IP is static (free while instance is running)
- **Storage**: 20 GB gp2 (default free-tier)

### 2c. EC2 Bootstrap (run after SSH in)
```bash
# Install Docker
sudo apt update && sudo apt install -y docker.io awscli
sudo usermod -aG docker ubuntu
newgrp docker

# Configure AWS credentials (or use IAM Instance Role — preferred)
aws configure   # set region and ECR pull credentials

# Pull and run the container
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.ap-south-1.amazonaws.com

docker run -d \
  --name codeview-execution \
  --restart unless-stopped \
  -p 5001:5001 \
  -e NODE_ENV=production \
  -e MONGO_URI="mongodb+srv://..." \
  -e PORT=5001 \
  -e LOG_FORMAT=json \
  123456789.dkr.ecr.ap-south-1.amazonaws.com/codeview-execution:latest
```

### 2d. Auto-pull on new image (for CI/CD)
Create `/home/ubuntu/redeploy.sh`:
```bash
#!/bin/bash
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.ap-south-1.amazonaws.com
docker pull 123456789.dkr.ecr.ap-south-1.amazonaws.com/codeview-execution:latest
docker stop codeview-execution && docker rm codeview-execution
docker run -d --name codeview-execution --restart unless-stopped \
  -p 5001:5001 \
  -e NODE_ENV=production \
  -e MONGO_URI="$MONGO_URI" \
  -e PORT=5001 \
  123456789.dkr.ecr.ap-south-1.amazonaws.com/codeview-execution:latest
```
Trigger this from Jenkins via SSH after pushing to ECR.

### ⚠️ Free-Tier Pitfalls
| Trap | How to avoid |
|------|-------------|
| t2.micro has 1 GB RAM — compiler jobs can OOM | Add 1 GB swap: `sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| ECR costs $0.10/GB storage | Keep only the latest 2-3 tags, add lifecycle policy |
| EC2 outbound transfer > 1 GB/month is billed | Use CloudWatch to monitor; execution responses are small |
| Instance stops if you stop it — Elastic IP charges apply | Always use an Elastic IP if the instance must be reachable |

---

## Phase 3 — API Service on Render

### Steps
1. Create account at render.com
2. **New → Web Service** → connect GitHub repo
3. **Build Command**: `cd api-service && npm install` (Render auto-detects Node.js)
   - OR use Docker deploy: point to `api-service/Dockerfile`, set build context = repo root
4. **Start Command**: `node server.js` (run from `api-service/`)
5. **Environment Variables** (set in Render dashboard):
   ```
   NODE_ENV=production
   PORT=10000              # Render's internal port (use process.env.PORT)
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=<32+ chars>
   JWT_EXPIRY=1d
   EXECUTION_SERVICE_URL=http://<ec2-elastic-ip>:5001
   FRONTEND_URL=https://your-app.vercel.app
   CACHE_ENABLED=false     # Redis disabled in production (free tier)
   LOG_FORMAT=json
   ```
6. **Health Check Path**: `/api/health`

### ⚠️ Render Free-Tier Pitfalls
| Trap | How to avoid |
|------|-------------|
| Free instances **spin down after 15 min inactivity** → 50s cold start | Add a UptimeRobot ping every 10 min to keep it alive |
| Render does NOT mount shared/ alongside api-service/ when using Node buildpack | Use Docker deploy (point to `api-service/Dockerfile`) — the Dockerfile copies shared/ correctly |
| Environment variables not set → 500 on startup | Double-check all vars; check Render logs immediately after deploy |
| The `PORT` env var is set by Render — your AppConfig must respect `process.env.PORT` | Already handled in `AppConfig.js` |

---

## Phase 4 — Frontend on Vercel

### Steps
1. Create account at vercel.com → Import GitHub repo
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**:
   ```
   VITE_API_URL=https://your-render-app.onrender.com
   ```
6. Vercel auto-detects Vite — no extra config needed
7. Add `vercel.json` (already in `frontend/vercel.json`) for SPA routing fallback

### ⚠️ Frontend Pitfalls
| Trap | How to avoid |
|------|-------------|
| `VITE_API_URL` must be set at **build time** not runtime | Set it in Vercel's Environment Variables before deploying |
| CORS errors | Ensure `FRONTEND_URL` in Render matches your Vercel URL exactly (include `https://`) |
| Vercel preview deployments use different URLs | Set `FRONTEND_URL=*` in Render for dev, restrict in prod |

---

## Phase 5 — Wiring Everything Together

### CORS Configuration Check
In `api-service/src/app.js`, the CORS origin in production is `appConfig.frontendUrl`.  
Set `FRONTEND_URL=https://your-vercel-app.vercel.app` on Render.

### Execution Service URL
In Render's env vars: `EXECUTION_SERVICE_URL=http://<ec2-elastic-ip>:5001`  
The EC2 Security Group must allow port 5001 from Render's outbound IPs (or 0.0.0.0/0).

### End-to-End Test Sequence
```
1. MongoDB Atlas: test connection with mongosh "mongodb+srv://..."
2. Execution Service:  curl http://<ec2-ip>:5001/api/health  → {"success":true}
3. API Service:        curl https://your-api.onrender.com/api/health  → {"success":true}
4. Frontend:           Open https://your-app.vercel.app → login → submit code → verify result
```

---

## CI/CD for Production (extend Jenkins pipeline)

Add a stage to the `Jenkinsfile` after `Push Images`:
```groovy
stage('Deploy to Production') {
    when { branch 'main' }
    parallel {
        stage('Render redeploy') {
            steps {
                // Render auto-deploys on push if GitHub is connected.
                // Or use the deploy hook:
                sh "curl -X POST https://api.render.com/deploy/srv-XXXXX?key=YYYYY"
            }
        }
        stage('EC2 redeploy') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh "ssh ubuntu@<elastic-ip> 'bash /home/ubuntu/redeploy.sh'"
                }
            }
        }
    }
}
```

---

## Resume Bullet Points (what to highlight)

```
• Containerised a 3-service Node.js/React microservices application using multi-stage Docker builds,
  reducing image sizes by ~60% versus naive builds.

• Designed and implemented a CI/CD pipeline in Jenkins (8 stages: checkout → test → build →
  security scan → push → deploy → smoke test) that builds, scans with Trivy, and deploys three
  Docker images to Kubernetes on every merge to main.

• Orchestrated deployments with Ansible (kubernetes.core collection) — idempotent playbooks for
  cluster setup, secrets management, rolling K8s deployments, and ELK stack provisioning.

• Deployed a full ELK stack (Elasticsearch + Logstash + Kibana + Filebeat DaemonSet) in Kubernetes,
  with structured JSON logging from all services enabling per-service log filtering in Kibana.

• Configured Kubernetes Horizontal Pod Autoscalers (HPA) for both backend services, scaling
  execution-service pods 2→8 based on CPU (65% threshold) with a 30-second stabilisation window
  to handle submission bursts without over-provisioning.

• Deployed production frontend to Vercel, REST API to Render (with keep-alive monitoring), and
  code execution service on AWS EC2 with Docker images pulled from AWS ECR — all backed by
  MongoDB Atlas.
```

---

## Notes — What Interviewers Will Ask

1. **"Why Render for the API and not EC2?"** — Render's free tier is simpler to manage for a
   stateless HTTP service; EC2 is used for execution-service because it needs persistent compiler
   binaries and privileged Docker access that Render doesn't expose.

2. **"How do you handle secrets?"** — K8s Secrets + `.dockerignore` + environment variables in
   Render/Vercel UI. Never committed to git. Template files in repo have placeholder base64 values.

3. **"What happens if execution-service crashes?"** — EC2 `--restart unless-stopped` brings it
   back. In K8s, the Deployment restarts it. The API service's HTTP call to execution-service
   will return a 502 which is surfaced to the user as a clean error.

4. **"How does HPA work?"** — metrics-server scrapes pod CPU/memory every 15s. The HPA controller
   compares the average utilisation to the target threshold and calculates the desired replica count.
   Scale-up is fast (30s window); scale-down is conservative (300s) to avoid thrashing.

5. **"What would you improve with more time?"** — Replace the EC2 instance with Fargate (no instance
   management), add Redis for session caching on Render, use Terraform instead of Ansible for
   infrastructure provisioning, and add Prometheus/Grafana for metrics alongside ELK for logs.
