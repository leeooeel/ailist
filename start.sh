#!/bin/sh

# 改进的启动脚本 - 2026-01-21

# 输出日志
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting AI Task Management System..."

# 确保在根目录启动
cd /

# 1. 安装后端依赖
log "Installing backend dependencies..."
cd /app/backend
npm install --omit=dev
if [ $? -ne 0 ]; then
    log "ERROR: Failed to install backend dependencies"
    exit 1
fi
log "Backend dependencies installed successfully"

# 2. 启动后端服务（非阻塞）
log "Starting backend service on port 3001..."
node index.js &
BACKEND_PID=$!
log "Backend service started with PID: $BACKEND_PID"

# 3. 等待后端服务启动完成（最多等待10秒）
log "Waiting for backend service to start..."
BACKEND_READY=0
for i in {1..10}; do
    if curl -s http://localhost:3001/api/health > /dev/null; then
        BACKEND_READY=1
        break
    fi
    log "Backend not ready yet, waiting 1 second..."
    sleep 1
done

if [ $BACKEND_READY -eq 0 ]; then
    log "WARNING: Backend service did not start within 10 seconds, continuing anyway..."
fi

# 4. 启动Caddy web服务器（在项目根目录）
log "Starting Caddy web server on port 8080..."
cd /app
caddy run --config /etc/caddy/Caddyfile

# 5. 等待后端服务
log "Waiting for backend service to exit..."
wait $BACKEND_PID
log "Backend service exited"

