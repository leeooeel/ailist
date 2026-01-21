#!/bin/sh

# 进入项目根目录
cd /app

# 启动后端服务
cd backend
npm install --omit=dev &
BACKEND_PID=$!
cd ..

# 启动Caddy web服务器（使用正确的配置文件路径）
caddy run --config /etc/caddy/Caddyfile

# 等待后端服务
wait $BACKEND_PID
