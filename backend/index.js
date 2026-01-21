const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const OpenAI = require('openai');

// 加载环境变量
dotenv.config();

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors({
  origin: '*', // 允许所有域名访问，适配Zeabur部署环境
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager')
.then(() => {
  console.log('MongoDB连接成功');
}).catch(err => {
  console.error('MongoDB连接失败:', err);
  console.log('注意：MongoDB连接失败，但服务器仍将继续运行，部分功能可能受限');
});

// AI配置
let aiEnabled = false;
let aiService = null;
const aiConfig = {
  type: process.env.AI_SERVICE_TYPE || 'deepseek', // 'openai', 'wenxin', 'deepseek', 'none'
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  wenxin: {
    apiKey: process.env.WENXIN_API_KEY,
    secretKey: process.env.WENXIN_SECRET_KEY
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY
  }
};

// 初始化AI服务
async function initAIService() {
  switch (aiConfig.type) {
    case 'openai':
      if (aiConfig.openai.apiKey && aiConfig.openai.apiKey !== 'your_openai_api_key_here') {
        try {
          const openai = new OpenAI({
            apiKey: aiConfig.openai.apiKey
          });
          aiService = {
            type: 'openai',
            client: openai
          };
          aiEnabled = true;
          console.log('OpenAI客户端初始化成功');
        } catch (error) {
          console.error('OpenAI客户端初始化失败:', error.message);
          aiEnabled = false;
        }
      }
      break;
      
    case 'wenxin':
      if (aiConfig.wenxin.apiKey && aiConfig.wenxin.secretKey) {
        try {
          aiService = {
            type: 'wenxin',
            apiKey: aiConfig.wenxin.apiKey,
            secretKey: aiConfig.wenxin.secretKey
          };
          aiEnabled = true;
          console.log('百度文心一言客户端初始化成功');
        } catch (error) {
          console.error('百度文心一言客户端初始化失败:', error.message);
          aiEnabled = false;
        }
      }
      break;
      
    case 'deepseek':
      if (aiConfig.deepseek.apiKey) {
        try {
          aiService = {
            type: 'deepseek',
            apiKey: aiConfig.deepseek.apiKey
          };
          aiEnabled = true;
          console.log('DeepSeek客户端初始化成功');
        } catch (error) {
          console.error('DeepSeek客户端初始化失败:', error.message);
          aiEnabled = false;
        }
      }
      break;
      
    default:
      console.log('AI功能未配置，使用默认模式');
      aiEnabled = false;
      break;
  }
}

// 获取百度文心一言的访问令牌
async function getWenxinAccessToken() {
  try {
    const response = await fetch('https://aip.baidubce.com/oauth/2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: aiService.apiKey,
        client_secret: aiService.secretKey
      })
    });
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('获取百度文心一言访问令牌失败:', error);
    throw error;
  }
}

// 调用百度文心一言API
async function callWenxinAPI(messages) {
  try {
    const accessToken = await getWenxinAccessToken();
    const response = await fetch('https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('调用百度文心一言API失败:', error);
    throw error;
  }
}

// 调用AI服务的统一接口
async function callAIService(messages) {
  if (!aiEnabled) {
    throw new Error('AI功能未启用');
  }
  
  switch (aiService.type) {
    case 'openai':
      const completion = await aiService.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });
      return completion.choices[0].message.content;
      
    case 'wenxin':
      return await callWenxinAPI(messages);
      
    case 'deepseek':
      // DeepSeek API 与 OpenAI API 兼容，使用自定义请求
      const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiService.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: messages,
          temperature: 0.7,
          max_tokens: 500
        })
      });
      
      const deepseekData = await deepseekResponse.json();
      if (deepseekData.error) {
        throw new Error(`DeepSeek API错误: ${deepseekData.error.message}`);
      }
      return deepseekData.choices[0].message.content;
      
    default:
      throw new Error('不支持的AI服务类型');
  }
}

// 初始化AI服务
initAIService();

// 定义数据模型
const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  dueDate: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed'],
    default: 'todo'
  },
  tags: [String],
  category: String,
  isImportant: Boolean,
  isUrgent: Boolean,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.model('Task', TaskSchema);

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', MessageSchema);

// 健康检查 - 支持Zeabur平台健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Task Manager API is running', timestamp: new Date().toISOString() });
});

// API健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Task Manager API is running' });
});

// 任务管理API

// 获取所有任务
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({}).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: '获取任务失败' });
  }
});

// 创建任务
app.post('/api/tasks', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: '创建任务失败' });
  }
});

// 更新任务
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: '更新任务失败' });
  }
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: '任务删除成功' });
  } catch (err) {
    res.status(400).json({ error: '删除任务失败' });
  }
});

// 标记任务完成
app.patch('/api/tasks/:id/complete', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: '更新任务状态失败' });
  }
});

// 获取四象限任务
app.get('/api/tasks/quadrant', async (req, res) => {
  try {
    const tasks = await Task.find({});
    
    const quadrantTasks = {
      importantUrgent: tasks.filter(task => task.isImportant && task.isUrgent),
      importantNotUrgent: tasks.filter(task => task.isImportant && !task.isUrgent),
      notImportantUrgent: tasks.filter(task => !task.isImportant && task.isUrgent),
      notImportantNotUrgent: tasks.filter(task => !task.isImportant && !task.isUrgent)
    };
    
    res.json(quadrantTasks);
  } catch (err) {
    res.status(500).json({ error: '获取四象限任务失败' });
  }
});

// AI助手API

// 获取对话历史
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: '获取对话历史失败' });
  }
});

// 发送消息给AI助手
app.post('/api/messages', async (req, res) => {
  try {
    const { content } = req.body;
    
    // 保存用户消息
    const userMessage = new Message({ role: 'user', content });
    await userMessage.save();
    
    // 检查AI功能是否启用
    if (!aiEnabled) {
      // AI功能禁用时，返回默认回复
      const defaultResponse = new Message({
        role: 'assistant',
        content: 'AI功能尚未配置。你可以在.env文件中设置以下任意一种AI服务：\n' +
                '1. OpenAI API: 设置OPENAI_API_KEY\n' +
                '2. 百度文心一言: 设置WENXIN_API_KEY和WENXIN_SECRET_KEY\n' +
                '3. 其他AI服务: 可根据文档扩展支持\n\n' +
                '你仍然可以使用任务管理的基本功能，包括：\n- 创建和管理任务\n- 查看任务列表\n- 使用四象限视图\n- 标记任务完成'
      });
      await defaultResponse.save();
      return res.json(defaultResponse);
    }
    
    // 获取历史对话
    const historyMessages = await Message.find({}).sort({ createdAt: 1 });
    const formattedHistory = historyMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // 调用统一AI服务接口
    const aiResponse = await callAIService([
      {
        role: 'system',
        content: '你是一个AI任务管理助手，能够理解自然语言并帮助用户创建、管理和分析任务。你可以：1. 智能创建任务（例如："明天下午3点开会"）；2. 分析任务优先级；3. 提供时间管理建议；4. 优化任务安排。请使用友好、专业的语言回答用户的问题。'
      },
      ...formattedHistory
    ]);
    
    // 保存AI回复
    const assistantMessage = new Message({
      role: 'assistant',
      content: aiResponse
    });
    await assistantMessage.save();
    
    res.json(assistantMessage);
  } catch (err) {
    console.error('AI回复失败:', err);
    res.status(500).json({ error: 'AI助手回复失败: ' + err.message });
  }
});

// 清除对话历史
app.delete('/api/messages', async (req, res) => {
  try {
    await Message.deleteMany({});
    res.json({ message: '对话历史已清除' });
  } catch (err) {
    res.status(500).json({ error: '清除对话历史失败' });
  }
});

// AI任务分析
app.post('/api/ai/analyze-tasks', async (req, res) => {
  try {
    // 检查AI功能是否启用
    if (!aiEnabled) {
      return res.status(403).json({
        error: 'AI功能尚未配置。请在.env文件中设置有效的AI服务密钥以启用任务分析功能。' +
                '\n支持的AI服务：OpenAI API、百度文心一言'
      });
    }
    
    const { tasks } = req.body;
    
    // 调用统一AI服务接口
    const analysis = await callAIService([
      {
        role: 'system',
        content: '你是一个专业的任务分析助手，请根据用户提供的任务列表，按照重要性和紧急性进行四象限分析，并提供优先级排序和时间管理建议。'
      },
      {
        role: 'user',
        content: `请分析以下任务列表，输出四象限分类、优先级排序和时间管理建议：\n${JSON.stringify(tasks, null, 2)}`
      }
    ]);
    
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: '任务分析失败: ' + err.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
