#!/bin/sh

# 启动后端服务
cd /app/backend
npm install &
BACKEND_PID=$!

# 启动Caddy web服务器
caddy run --config /etc/caddy/Caddyfile

# 等待后端服务
wait $BACKEND_PID
