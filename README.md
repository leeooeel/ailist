# AI任务管理系统

一个集成DeepSeek AI的全栈任务管理应用。

## 功能特性

### 🤖 AI能力
- **智能任务解析**: 自然语言输入自动转换为结构化任务
- **四象限分类**: AI自动将任务分类到四个象限
- **专注提示语**: 根据任务生成激励性专注提示
- **数据分析**: AI智能分析任务数据并生成总结
- **AI助手**: 实时对话交互

### 📋 任务管理
- 快速任务添加
- 多视图展示（列表、四象限、番茄专注）
- 任务状态管理
- 优先级和标签系统

### 🎯 时间管理
- 番茄工作法计时器
- 专注统计
- 任务完成率跟踪

## 技术栈

### 前端
- HTML5 + CSS3 + JavaScript (ES6+)
- 响应式设计
- 模块化架构

### 后端
- Node.js + Express
- MongoDB数据库
- DeepSeek AI API集成

## 本地开发

### 前置要求
- Node.js 18+
- MongoDB 4.4+
- DeepSeek API Key

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd ai-task-manager
```

2. **安装依赖**
```bash
# 后端
cd backend
npm install

# 前端无需安装依赖
```

3. **配置环境变量**

在 `backend/.env` 文件中添加：
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/task-manager
AI_SERVICE_TYPE=deepseek
DEEPSEEK_API_KEY=your_deepseek_api_key
```

4. **启动开发服务器**

```bash
# 后端
cd backend
node index.js

# 前端（使用静态文件服务器）
npx serve . -l 3000
```

5. **访问应用**

打开浏览器访问：http://localhost:3000/task-management-app.html

## 部署方案

### GitHub + Railway 一键部署

#### 1. 后端部署（Railway）

1. 登录Railway并连接GitHub仓库
2. 配置环境变量：
   - `PORT=3001`
   - `MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/task-manager`
   - `AI_SERVICE_TYPE=deepseek`
   - `DEEPSEEK_API_KEY=your_deepseek_api_key`
3. 部署后获取Railway提供的API地址

#### 2. 前端部署（GitHub Pages/Vercel）

1. 在 `task-management-app.html` 中更新API_BASE_URL为Railway地址
2. 推送到GitHub仓库
3. 部署到GitHub Pages或Vercel

## 使用说明

### 智能任务创建
```
输入示例：
"明天下午3点客户会议，工作标签，重要"
"下周五前完成项目报告，高优先级"
"每天早上8点提醒我健身，健康标签"
```

### AI助手指令
```
示例指令：
"帮我分析本周任务"
"创建一个重要紧急的任务"
"给我一些时间管理建议"
```

## 项目结构

```
ai-task-manager/
├── backend/                 # 后端代码
│   ├── index.js            # 主入口文件
│   ├── package.json        # 依赖配置
│   └── .env.example       # 环境变量示例
├── utils/                  # 前端工具函数
│   └── aiTaskService.js   # AI服务函数
├── task-management-app.html # 主应用页面
├── .gitignore             # Git忽略配置
└── README.md             # 项目文档
```

## 许可证

MIT License
