const API_BASE_URL = 'http://localhost:3001/api';

async function callDeepSeekAPI(messages, temperature = 0.7) {
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: messages[messages.length - 1].content })
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    throw error;
  }
}

export async function parseTaskByAI(userInput) {
  const messages = [
    {
      role: 'system',
      content: `你是一个任务解析助手。请将用户的自然语言输入解析为结构化的任务数据。
      
返回格式必须是JSON对象，包含以下字段：
- title: 任务标题（字符串）
- description: 任务描述（字符串，如果没有则为空）
- dueDate: 截止日期（ISO 8601格式，如"2024-01-20T15:00:00.000Z"，如果没有则为null）
- priority: 优先级（"low"、"medium"、"high"、"urgent"）
- tags: 标签数组（如["工作", "重要"]）
- isImportant: 是否重要（布尔值）
- isUrgent: 是否紧急（布尔值）

示例：
输入："明天下午3点客户会议，工作标签，重要"
输出：
{
  "title": "客户会议",
  "description": "明天下午3点的客户会议",
  "dueDate": "2024-01-20T15:00:00.000Z",
  "priority": "high",
  "tags": ["工作"],
  "isImportant": true,
  "isUrgent": false
}

只返回JSON，不要其他文字。`
    },
    {
      role: 'user',
      content: userInput
    }
  ];

  try {
    const response = await callDeepSeekAPI(messages, 0.3);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI返回的不是有效的JSON格式');
    }
    
    const taskData = JSON.parse(jsonMatch[0]);
    
    return {
      title: taskData.title || userInput,
      description: taskData.description || '',
      dueDate: taskData.dueDate || null,
      priority: taskData.priority || 'medium',
      tags: taskData.tags || [],
      isImportant: taskData.isImportant || false,
      isUrgent: taskData.isUrgent || false,
      status: 'todo'
    };
  } catch (error) {
    console.error('AI解析任务失败:', error);
    return null;
  }
}

export async function classifyTasksByAI(tasks) {
  if (!tasks || tasks.length === 0) {
    return {
      importantUrgent: [],
      importantNotUrgent: [],
      notImportantUrgent: [],
      notImportantNotUrgent: []
    };
  }

  const messages = [
    {
      role: 'system',
      content: `你是一个任务分类助手。请根据任务的重要性和紧急性将任务分类到四个象限。

返回格式必须是JSON对象，包含以下四个数组：
- importantUrgent: 重要且紧急的任务ID数组
- importantNotUrgent: 重要但不紧急的任务ID数组
- notImportantUrgent: 紧急但不重要的任务ID数组
- notImportantNotUrgent: 不重要且不紧急的任务ID数组

分类标准：
- 重要紧急：对目标影响大且时间紧迫
- 重要不紧急：对目标影响大但时间不紧迫
- 紧急不重要：时间紧迫但对目标影响小
- 不重要不紧急：对目标影响小且时间不紧迫

只返回JSON，不要其他文字。`
    },
    {
      role: 'user',
      content: JSON.stringify(tasks.map(task => ({
        id: task._id || task.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        tags: task.tags
      })))
    }
  ];

  try {
    const response = await callDeepSeekAPI(messages, 0.3);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI返回的不是有效的JSON格式');
    }
    
    const classification = JSON.parse(jsonMatch[0]);
    
    const taskMap = {};
    tasks.forEach(task => {
      taskMap[task._id || task.id] = task;
    });
    
    return {
      importantUrgent: classification.importantUrgent.map(id => taskMap[id]).filter(Boolean),
      importantNotUrgent: classification.importantNotUrgent.map(id => taskMap[id]).filter(Boolean),
      notImportantUrgent: classification.notImportantUrgent.map(id => taskMap[id]).filter(Boolean),
      notImportantNotUrgent: classification.notImportantNotUrgent.map(id => taskMap[id]).filter(Boolean)
    };
  } catch (error) {
    console.error('AI分类任务失败:', error);
    return null;
  }
}

export async function getPomodoroPromptByAI(taskTitle) {
  const messages = [
    {
      role: 'system',
      content: '根据任务标题生成友好的专注提示语，简短有激励性，不超过50字'
    },
    {
      role: 'user',
      content: `任务：${taskTitle}`
    }
  ];

  try {
    return await callDeepSeekAPI(messages, 0.7);
  } catch (error) {
    console.error('AI生成专注提示语失败:', error);
    return '保持专注，你可以做到的！';
  }
}

export async function getStatsSummaryByAI(statsData) {
  const messages = [
    {
      role: 'system',
      content: '分析任务统计数据，生成简洁的自然语言总结，不超过100字'
    },
    {
      role: 'user',
      content: JSON.stringify(statsData)
    }
  ];

  try {
    return await callDeepSeekAPI(messages, 0.5);
  } catch (error) {
    console.error('AI生成统计总结失败:', error);
    return '数据统计完成，继续保持高效工作！';
  }
}

export async function sendAIMessage(userMessage) {
  const messages = [
    {
      role: 'system',
      content: '你是一个AI任务管理助手，能够理解自然语言并帮助用户创建、管理和分析任务。你可以：1. 智能创建任务（例如："明天下午3点开会"）；2. 分析任务优先级；3. 提供时间管理建议；4. 优化任务安排。请使用友好、专业的语言回答用户的问题。'
    },
    {
      role: 'user',
      content: userMessage
    }
  ];

  try {
    return await callDeepSeekAPI(messages, 0.7);
  } catch (error) {
    console.error('AI回复失败:', error);
    throw error;
  }
}