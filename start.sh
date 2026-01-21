#!/bin/sh

# 确保在根目录启动
cd /

# 启动后端服务
cd /app/backend
npm install --omit=dev &
BACKEND_PID=$!

# 返回到项目根目录，确保Caddy能找到静态文件
cd /app

# 启动Caddy web服务器（在项目根目录）
caddy run --config /etc/caddy/Caddyfile

# 等待后端服务
wait $BACKEND_PID
