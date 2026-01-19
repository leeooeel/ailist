# 极简部署指南：GitHub + Railway

## 一、GitHub 仓库设置

### 1. 创建仓库
1. 登录 GitHub
2. 创建新仓库 `ai-task-manager`
3. 复制仓库 URL

### 2. 推送代码
```bash
# 添加远程仓库
git remote add origin https://github.com/<your-username>/ai-task-manager.git

# 推送代码
git push -u origin master
```

## 二、后端部署（Railway）

### 1. 连接 Railway
1. 登录 [Railway](https://railway.app/)
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库

### 2. 配置环境变量
在 Railway 项目设置中添加以下环境变量：

```env
PORT=3001
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/task-manager
AI_SERVICE_TYPE=deepseek
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 3. 部署
Railway 会自动检测 `railway.json` 配置并开始部署。

### 4. 获取 API 地址
部署完成后，Railway 会提供一个类似 `https://ai-task-manager-abc123.railway.app` 的地址。

## 三、前端部署（Vercel）

### 1. 连接 Vercel
1. 登录 [Vercel](https://vercel.com/)
2. 点击 "Add New Project"
3. 选择你的仓库

### 2. 配置
- 构建命令：无需配置（静态文件）
- 输出目录：无需配置

### 3. 更新 API 地址
在 `task-management-app.html` 中找到 `API_BASE_URL` 变量，替换为 Railway 提供的地址：

```javascript
const API_BASE_URL = 'https://ai-task-manager-abc123.railway.app';
```

### 4. 部署
Vercel 会自动部署前端应用。

## 四、MongoDB Atlas 配置

### 1. 创建数据库
1. 登录 [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. 创建免费集群
3. 配置 IP 白名单（允许所有 IP 访问）
4. 创建数据库用户

### 2. 获取连接字符串
复制 MongoDB Atlas 提供的连接字符串，格式如下：

```
mongodb+srv://<username>:<password>@cluster.mongodb.net/task-manager
```

### 3. 更新环境变量
在 Railway 环境变量中更新 `MONGODB_URI`。

## 五、GitHub Actions 配置

### 1. 添加 Secrets
在 GitHub 仓库设置 → Secrets and variables → Actions 中添加以下 secrets：

- `VERCEL_TOKEN`: Vercel API 令牌
- `ORG_ID`: Vercel 组织 ID
- `PROJECT_ID`: Vercel 项目 ID
- `RAILWAY_TOKEN`: Railway API 令牌
- `FRONTEND_URL`: Vercel 部署地址
- `BACKEND_URL`: Railway 部署地址

### 2. 触发 CI/CD
推送代码到 `main` 或 `master` 分支会自动触发 CI/CD 流程。

## 六、健康检查

GitHub Actions 会每 6 小时自动检查应用健康状态。

## 七、手动部署

可以通过 GitHub Actions 手动触发部署：

1. 进入仓库 Actions 页面
2. 选择 "Manual Deploy"
3. 点击 "Run workflow"
4. 选择环境

## 八、监控

### 1. Railway 监控
- 查看部署日志
- 监控 CPU 和内存使用
- 配置警报

### 2. Vercel 监控
- 查看部署历史
- 监控访问统计
- 配置错误警报

## 九、故障排除

### 常见问题

1. **连接失败**
   - 检查环境变量是否正确
   - 确认 MongoDB Atlas IP 白名单配置
   - 验证 API 密钥是否有效

2. **部署失败**
   - 查看 Railway/Vercel 日志
   - 检查代码语法错误
   - 确认依赖版本

3. **性能问题**
   - 优化数据库查询
   - 启用 Railway 自动缩放
   - 配置 CDN

## 十、备份与恢复

### 1. 数据库备份
- MongoDB Atlas 自动每日备份
- 手动创建快照

### 2. 代码备份
- GitHub 版本控制
- 定期导出仓库

## 十一、安全建议

1. **环境变量**
   - 从不提交敏感信息到仓库
   - 使用加密的环境变量
   - 定期轮换 API 密钥

2. **访问控制**
   - 最小权限原则
   - 启用双因素认证
   - 定期审查权限

3. **数据安全**
   - 加密敏感数据
   - 配置数据库访问控制
   - 定期审计日志

## 十二、扩展建议

### 1. 性能优化
- 启用 Railway 自动缩放
- 配置 CDN
- 实现缓存策略

### 2. 功能扩展
- 添加用户认证
- 实现协作功能
- 集成更多 AI 服务

### 3. 监控扩展
- 集成 Datadog
- 配置自定义警报
- 实现错误追踪

---

**部署完成！** 🎉

你的 AI 任务管理系统现在已经部署在云端，可以通过 Vercel 地址访问。
