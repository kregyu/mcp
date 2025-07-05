export declare class KPCAssistant {
    private dataLoader;
    private validator;
    private exampleGenerator;
    private formatter;
    private initialized;
    constructor();
    /**
     * 初始化助手
     */
    initialize(): Promise<void>;
    /**
     * 回答关于KPC组件的问题
     */
    answerQuestion(question: string): Promise<string>;
    /**
     * 解析用户意图
     */
    private parseIntent;
    /**
     * 提取组件名称
     */
    private extractComponentName;
    /**
     * 提取使用场景
     */
    private extractScenario;
    /**
     * 提取属性信息
     */
    private extractProps;
    /**
     * 提取搜索关键词
     */
    private extractSearchQuery;
    /**
     * 提取分类
     */
    private extractCategory;
    /**
     * 获取组件信息
     */
    private getComponentInfo;
    /**
     * 搜索组件
     */
    private searchComponents;
    /**
     * 验证使用方式
     */
    private validateUsage;
    /**
     * 获取示例
     */
    private getExamples;
    /**
     * 列出组件
     */
    private listComponents;
    /**
     * 获取统计信息
     */
    private getStats;
    /**
     * 处理一般性问题
     */
    private handleGeneralQuestion;
}
//# sourceMappingURL=kpc-assistant.d.ts.map