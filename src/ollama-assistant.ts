/**
 * Ollama + KPC MCP 智能助手
 */
import { KPCAssistant } from './kpc-assistant.js';

export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export interface FunctionCall {
    name: string;
    arguments: Record<string, any>;
}

export class KPCOllamaAssistant {
    private kpcAssistant: KPCAssistant;
    private ollamaHost: string;
    private model: string;

    constructor(ollamaHost = 'http://localhost:11434', model = 'qwen3:8b') {
        this.ollamaHost = ollamaHost;
        this.model = model;
        this.kpcAssistant = new KPCAssistant();
    }

    /**
     * 初始化助手
     */
    async initialize(): Promise<void> {
        await this.kpcAssistant.initialize();
        console.log('✅ KPC Ollama助手初始化完成');
    }

    /**
     * 智能问答主入口
     */
    async chat(userMessage: string): Promise<string> {
        try {
            // 1. 先尝试直接用KPC助手回答
            const kpcResponse = await this.tryKPCDirectAnswer(userMessage);
            if (kpcResponse) {
                return kpcResponse;
            }

            // 2. 使用Ollama + Function Calling
            return await this.chatWithFunctionCalling(userMessage);
        } catch (error) {
            console.error('Chat error:', error);
            return `抱歉，处理您的问题时出现错误：${error}`;
        }
    }

    /**
     * 尝试直接用KPC助手回答
     */
    private async tryKPCDirectAnswer(message: string): Promise<string | null> {
        // 不再直接回答，都通过AI处理
        return null;
    }

    /**
     * 使用Ollama Function Calling模式
     */
    private async chatWithFunctionCalling(userMessage: string): Promise<string> {
        const systemPrompt = this.buildSystemPrompt();
        
        // 第一步：让AI分析是否需要工具
        const analysisPrompt = `${systemPrompt}

用户问题：${userMessage}

请分析这个问题是否需要查询KPC组件信息。如果需要，请指定需要调用的工具和参数。

请只回复JSON格式，不要其他内容：
{
  "need_tool": true/false,
  "reason": "分析原因",
  "tool_call": {
    "name": "工具名称",
    "arguments": {...}
  }
}

可用工具：
- get_kpc_component: 获取指定组件详细信息，参数: {"component": "组件名"}
- search_kpc_components: 搜索组件，参数: {"query": "关键词"}
- get_kpc_examples: 获取使用示例，参数: {"component": "组件名", "scenario": "场景"}
- validate_kpc_usage: 验证用法，参数: {"component": "组件名", "props": {...}}`;

        console.log('🤔 AI正在分析问题...');
        const analysisResponse = await this.callOllama(analysisPrompt);
        
        let analysis;
        try {
            analysis = JSON.parse(analysisResponse.trim());
        } catch (e) {
            // 如果无法解析，直接回答
            return await this.directAnswer(userMessage);
        }

        if (analysis.need_tool && analysis.tool_call) {
            console.log(`🔧 调用工具: ${analysis.tool_call.name}`);
            
            // 执行工具调用
            const toolResult = await this.executeTool(analysis.tool_call);
            
            // 第二步：基于工具结果生成最终回答
            return await this.generateFinalAnswer(userMessage, toolResult, analysis.reason);
        } else {
            // 直接回答
            return await this.directAnswer(userMessage);
        }
    }

    /**
     * 构建系统提示词
     */
    private buildSystemPrompt(): string {
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
    private getToolDefinitions() {
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
    private async callOllama(prompt: string): Promise<string> {
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

        const data: OllamaResponse = await response.json();
        return data.response;
    }


    /**
     * 执行工具调用
     */
    private async executeTool(toolCall: FunctionCall): Promise<string> {
        const { name, arguments: args } = toolCall;

        try {
            switch (name) {
                case 'get_kpc_component':
                    const component = this.kpcAssistant['dataLoader'].getComponent(args.component);
                    if (!component) {
                        return `组件 "${args.component}" 不存在`;
                    }
                    return this.kpcAssistant['formatter'].formatComponentAPI(component);
                
                case 'search_kpc_components':
                    const searchResults = this.kpcAssistant['dataLoader'].searchComponents(args.query, { 
                        category: args.category, 
                        fuzzy: true 
                    });
                    return this.kpcAssistant['formatter'].formatSearchResults(searchResults, args.query);
                
                case 'get_kpc_examples':
                    const comp = this.kpcAssistant['dataLoader'].getComponent(args.component);
                    if (!comp) {
                        return `组件 "${args.component}" 不存在`;
                    }
                    
                    let examples = comp.examples || [];
                    
                    if (args.scenario && examples.length === 0) {
                        const generated = this.kpcAssistant['exampleGenerator'].generateExampleByScenario(comp, args.scenario);
                        if (generated) {
                            examples = [generated];
                        }
                    }
                    
                    if (examples.length === 0) {
                        const basic = this.kpcAssistant['exampleGenerator'].generateBasicExample(comp);
                        examples = [basic];
                    }
                    
                    return this.kpcAssistant['formatter'].formatExamples(examples);
                
                case 'validate_kpc_usage':
                    const targetComp = this.kpcAssistant['dataLoader'].getComponent(args.component);
                    if (!targetComp) {
                        return `组件 "${args.component}" 不存在`;
                    }
                    
                    const validationResult = this.kpcAssistant['validator'].validate(targetComp, args.props);
                    return this.kpcAssistant['formatter'].formatValidationResult(validationResult);
                
                default:
                    return `未知工具：${name}`;
            }
        } catch (error) {
            return `工具执行失败：${error}`;
        }
    }

    /**
     * 直接回答（无需工具）
     */
    private async directAnswer(userMessage: string): Promise<string> {
        const prompt = `你是一个专业的前端开发助手，特别擅长Vue组件开发。

用户问题：${userMessage}

请用友好、专业的语调回答用户的问题。如果问题与KPC组件库相关但你需要更具体的信息，请引导用户提供更多细节。`;

        console.log('💭 AI正在思考回答...');
        return await this.callOllama(prompt);
    }

    /**
     * 生成最终答案
     */
    private async generateFinalAnswer(userMessage: string, toolResult: string, reason?: string): Promise<string> {
        const prompt = `你是KPC组件库专家，基于以下信息回答用户问题：

用户问题：${userMessage}

${reason ? `分析原因：${reason}` : ''}

工具查询结果：
${toolResult}

请根据查询结果，用友好、专业的语调回答用户问题：
1. 直接回答用户的问题
2. 提供实用的建议和代码示例
3. 如果合适，补充相关的最佳实践
4. 保持回答简洁明了`;

        console.log('💡 AI正在生成最终回答...');
        return await this.callOllama(prompt);
    }

    /**
     * 流式聊天（实时响应）
     */
    async chatStream(userMessage: string, onChunk: (chunk: string) => void): Promise<void> {
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
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const data: OllamaResponse = JSON.parse(line);
                        if (data.response) {
                            onChunk(data.response);
                        }
                    } catch (e) {
                        // 忽略JSON解析错误
                    }
                }
            }
        } catch (error) {
            console.error('Stream chat error:', error);
            onChunk(`抱歉，处理您的问题时出现错误：${error}`);
        }
    }
}