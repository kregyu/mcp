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
export declare class KPCOllamaAssistant {
    private kpcAssistant;
    private ollamaHost;
    private model;
    constructor(ollamaHost?: string, model?: string);
    /**
     * 初始化助手
     */
    initialize(): Promise<void>;
    /**
     * 智能问答主入口
     */
    chat(userMessage: string): Promise<string>;
    /**
     * 尝试直接用KPC助手回答
     */
    private tryKPCDirectAnswer;
    /**
     * 使用Ollama Function Calling模式
     */
    private chatWithFunctionCalling;
    /**
     * 构建系统提示词
     */
    private buildSystemPrompt;
    /**
     * 获取工具定义
     */
    private getToolDefinitions;
    /**
     * 调用Ollama API
     */
    private callOllama;
    /**
     * 执行工具调用
     */
    private executeTool;
    /**
     * 直接回答（无需工具）
     */
    private directAnswer;
    /**
     * 生成最终答案
     */
    private generateFinalAnswer;
    /**
     * 流式聊天（实时响应）
     */
    chatStream(userMessage: string, onChunk: (chunk: string) => void): Promise<void>;
}
//# sourceMappingURL=ollama-assistant.d.ts.map