# 多阶段构建：前端和后端分离

# 阶段1：前端构建（仅静态文件，无需构建过程）
FROM alpine:latest as frontend

# 设置工作目录
WORKDIR /app

# 复制前端文件
COPY . .

# 阶段2：后端构建
FROM node:18-alpine as backend

# 设置工作目录
WORKDIR /app/backend

# 复制后端文件
COPY backend/package*.json ./
COPY backend/index.js ./

# 安装依赖
RUN npm install --production

# 阶段3：最终镜像 - Caddy作为web服务器
FROM caddy:2.7-alpine

# 设置工作目录
WORKDIR /app

# 复制Caddy配置
COPY Caddyfile /etc/caddy/Caddyfile

# 从前端阶段复制静态文件
COPY --from=frontend /app /app

# 从后端阶段复制后端文件
COPY --from=backend /app/backend /app/backend

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 安装Node.js（用于运行后端）
RUN apk add --no-cache nodejs npm

# 暴露端口
EXPOSE 8080 3001

# 启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 启动命令
CMD ["/start.sh"]
