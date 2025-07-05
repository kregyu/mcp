/**
 * Ollama + KPC MCP 智能助手
 */
import { KPCAssistant } from './kpc-assistant.js';
export class KPCOllamaAssistant {
    kpcAssistant;
    ollamaHost;
    model;
    constructor(ollamaHost = 'http://localhost:11434', model = 'qwen3:8b') {
        this.ollamaHost = ollamaHost;
        this.model = model;
        this.kpcAssistant = new KPCAssistant();
    }
    /**
     * 初始化助手
     */
    async initialize() {
        await this.kpcAssistant.initialize();
        console.log('✅ KPC Ollama助手初始化完成');
    }
    /**
     * 智能问答主入口
     */
    async chat(userMessage) {
        try {
            // 1. 先尝试直接用KPC助手回答
            const kpcResponse = await this.tryKPCDirectAnswer(userMessage);
            if (kpcResponse) {
                return kpcResponse;
            }
            // 2. 使用Ollama + Function Calling
            return await this.chatWithFunctionCalling(userMessage);
        }
        catch (error) {
            console.error('Chat error:', error);
            return `抱歉，处理您的问题时出现错误：${error}`;
        }
    }
    /**
     * 尝试直接用KPC助手回答
     */
    async tryKPCDirectAnswer(message) {
        const msg = message.toLowerCase();
        // 如果明确是KPC相关问题，直接用KPC助手
        if (msg.includes('kpc') || msg.includes('组件') || msg.includes('button') ||
            msg.includes('form') || msg.includes('table') || msg.includes('input')) {
            return await this.kpcAssistant.answerQuestion(message);
        }
        return null;
    }
    /**
     * 使用Ollama Function Calling模式
     */
    async chatWithFunctionCalling(userMessage) {
        const systemPrompt = this.buildSystemPrompt();
        const tools = this.getToolDefinitions();
        const prompt = `${systemPrompt}

可用工具：
${JSON.stringify(tools, null, 2)}

用户问题：${userMessage}

请分析用户问题，如果需要查询KPC组件信息，请调用相应的工具。请以JSON格式回复，格式如下：
{
  "need_tool": true/false,
  "tool_call": {
    "name": "工具名称",
    "arguments": {...}
  },
  "response": "回答内容"
}`;
        // 调用Ollama
        const ollamaResponse = await this.callOllama(prompt);
        // 解析响应
        return await this.processOllamaResponse(ollamaResponse, userMessage);
    }
    /**
     * 构建系统提示词
     */
    buildSystemPrompt() {
        return `你是一个专业的KPC组件库助手。KPC是基于Vue的UI组件库。

你的职责：
1. 回答关于KPC组件的问题
2. 提供组件使用方法和示例
3. 验证组件配置是否正确
4. 搜索和推荐合适的组件

当用户询问KPC相关问题时，请使用提供的工具获取准确信息。

回答要求：
- 准确、简洁、实用
- 提供具体的代码示例
- 指出常见的使用误区
- 友好且专业的语调`;
    }
    /**
     * 获取工具定义
     */
    getToolDefinitions() {
        return [
            {
                name: 'get_kpc_component',
                description: '获取指定KPC组件的详细API信息',
                parameters: {
                    type: 'object',
                    properties: {
                        component: {
                            type: 'string',
                            description: '组件名称，如Button、Form、Table等'
                        }
                    },
                    required: ['component']
                }
            },
            {
                name: 'search_kpc_components',
                description: '根据关键词搜索KPC组件',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: '搜索关键词'
                        },
                        category: {
                            type: 'string',
                            description: '组件分类（可选）'
                        }
                    },
                    required: ['query']
                }
            },
            {
                name: 'get_kpc_examples',
                description: '获取KPC组件的使用示例',
                parameters: {
                    type: 'object',
                    properties: {
                        component: {
                            type: 'string',
                            description: '组件名称'
                        },
                        scenario: {
                            type: 'string',
                            description: '使用场景（可选）'
                        }
                    },
                    required: ['component']
                }
            },
            {
                name: 'validate_kpc_usage',
                description: '验证KPC组件的使用是否正确',
                parameters: {
                    type: 'object',
                    properties: {
                        component: {
                            type: 'string',
                            description: '组件名称'
                        },
                        props: {
                            type: 'object',
                            description: '组件属性配置'
                        }
                    },
                    required: ['component', 'props']
                }
            }
        ];
    }
    /**
     * 调用Ollama API
     */
    async callOllama(prompt) {
        const response = await fetch(`${this.ollamaHost}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.1,
                    top_p: 0.9,
                    num_predict: 2048
                }
            }),
        });
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.response;
    }
    /**
     * 处理Ollama响应
     */
    async processOllamaResponse(ollamaResponse, userMessage) {
        try {
            // 尝试解析JSON响应
            const parsed = JSON.parse(ollamaResponse);
            if (parsed.need_tool && parsed.tool_call) {
                // 执行工具调用
                const toolResult = await this.executeTool(parsed.tool_call);
                // 将工具结果传递给Ollama进行最终回答
                return await this.generateFinalAnswer(userMessage, toolResult);
            }
            else {
                return parsed.response || ollamaResponse;
            }
        }
        catch (e) {
            // 如果不是JSON格式，直接返回原响应
            return ollamaResponse;
        }
    }
    /**
     * 执行工具调用
     */
    async executeTool(toolCall) {
        const { name, arguments: args } = toolCall;
        switch (name) {
            case 'get_kpc_component':
                return await this.kpcAssistant.answerQuestion(`获取${args.component}组件信息`);
            case 'search_kpc_components':
                return await this.kpcAssistant.answerQuestion(`搜索${args.query}`);
            case 'get_kpc_examples':
                const exampleQuery = args.scenario
                    ? `${args.component}组件${args.scenario}示例`
                    : `${args.component}组件使用示例`;
                return await this.kpcAssistant.answerQuestion(exampleQuery);
            case 'validate_kpc_usage':
                return await this.kpcAssistant.answerQuestion(`验证${args.component}组件配置${JSON.stringify(args.props)}`);
            default:
                return `未知工具：${name}`;
        }
    }
    /**
     * 生成最终答案
     */
    async generateFinalAnswer(userMessage, toolResult) {
        const prompt = `基于以下信息回答用户问题：

用户问题：${userMessage}

工具查询结果：
${toolResult}

请根据查询结果，用友好、专业的语调回答用户问题，提供实用的建议和代码示例。`;
        return await this.callOllama(prompt);
    }
    /**
     * 流式聊天（实时响应）
     */
    async chatStream(userMessage, onChunk) {
        try {
            const systemPrompt = this.buildSystemPrompt();
            const prompt = `${systemPrompt}\n\n用户问题：${userMessage}`;
            const response = await fetch(`${this.ollamaHost}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: true,
                    options: {
                        temperature: 0.1,
                        top_p: 0.9,
                    }
                }),
            });
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to get response reader');
            }
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            onChunk(data.response);
                        }
                    }
                    catch (e) {
                        // 忽略JSON解析错误
                    }
                }
            }
        }
        catch (error) {
            console.error('Stream chat error:', error);
            onChunk(`抱歉，处理您的问题时出现错误：${error}`);
        }
    }
}
//# sourceMappingURL=ollama-assistant.js.map