#!/bin/sh

# Zeabur专用启动脚本 - 2026-01-21

# 输出日志（Zeabur日志系统兼容）
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "=== Starting AI Task Management System on Zeabur ==="

# 进入应用根目录
cd /app
log "Working directory: $(pwd)"

# 1. 安装后端依赖
log "1. Installing backend dependencies..."
cd backend
npm install --omit=dev
if [ $? -ne 0 ]; then
    log "ERROR: Failed to install backend dependencies"
    exit 1
fi
log "✅ Backend dependencies installed successfully"

# 2. 启动后端服务（非阻塞）
log "2. Starting backend service..."
node index.js &
BACKEND_PID=$!
log "✅ Backend service started with PID: $BACKEND_PID"

# 3. 等待后端服务启动完成（最多等待15秒）
log "3. Waiting for backend service to start..."
BACKEND_READY=0
for i in {1..15}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health | grep -q "200"; then
        BACKEND_READY=1
        log "✅ Backend service is ready!"
        break
    fi
    log "⏳ Backend not ready yet, waiting 1 second... (Attempt $i/15)"
    sleep 1
done

if [ $BACKEND_READY -eq 0 ]; then
    log "⚠️  WARNING: Backend service did not start within 15 seconds, continuing anyway..."
fi

# 4. 启动Caddy web服务器
log "4. Starting Caddy web server..."
cd /app
log "Caddyfile location: /etc/caddy/Caddyfile"
log "Static files root: /app"
log "Caddy will start on port 8080"

# 启动Caddy（前台运行，Zeabur会管理进程）
log "=== System startup complete! Application is running ==="
caddy run --config /etc/caddy/Caddyfile

# 如果Caddy退出，结束后端进程
log "⚠️  Caddy process exited, shutting down backend..."
kill $BACKEND_PID 2>/dev/null || true
log "=== System shutdown complete ==="


