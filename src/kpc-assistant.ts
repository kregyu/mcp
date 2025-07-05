/**
 * KPC问答助手 - 直接使用核心类
 */
import { KPCDataLoader } from './data-loader.js';
import { KPCUsageValidator } from './validators.js';
import { KPCExampleGenerator } from './example-generator.js';
import { KPCFormatter } from './formatters.js';

export class KPCAssistant {
    private dataLoader: KPCDataLoader;
    private validator: KPCUsageValidator;
    private exampleGenerator: KPCExampleGenerator;
    private formatter: KPCFormatter;
    private initialized = false;

    constructor() {
        this.dataLoader = KPCDataLoader.getInstance();
        this.validator = new KPCUsageValidator();
        this.exampleGenerator = new KPCExampleGenerator();
        this.formatter = new KPCFormatter();
    }

    /**
     * 初始化助手
     */
    async initialize(): Promise<void> {
        if (!this.initialized) {
            await this.dataLoader.initialize();
            this.initialized = true;
        }
    }

    /**
     * 回答关于KPC组件的问题
     */
    async answerQuestion(question: string): Promise<string> {
        await this.initialize();

        // 智能解析问题类型
        const intent = this.parseIntent(question);
        
        switch (intent.type) {
            case 'get_component':
                return this.getComponentInfo(intent.component!);
            
            case 'search':
                return this.searchComponents(intent.query!);
            
            case 'validate':
                return this.validateUsage(intent.component!, intent.props!);
            
            case 'example':
                return this.getExamples(intent.component!, intent.scenario);
            
            case 'list':
                return this.listComponents(intent.category);
            
            case 'stats':
                return this.getStats();
            
            default:
                return this.handleGeneralQuestion(question);
        }
    }

    /**
     * 解析用户意图
     */
    private parseIntent(question: string): {
        type: string;
        component?: string;
        query?: string;
        props?: any;
        scenario?: string;
        category?: string;
    } {
        const q = question.toLowerCase();

        // 检测组件名称
        const componentMatch = this.extractComponentName(question);
        
        if (q.includes('如何使用') || q.includes('怎么用') || q.includes('示例') || q.includes('例子')) {
            return {
                type: 'example',
                component: componentMatch,
                scenario: this.extractScenario(question)
            };
        }
        
        if (q.includes('验证') || q.includes('检查') || q.includes('正确吗')) {
            return {
                type: 'validate',
                component: componentMatch,
                props: this.extractProps(question)
            };
        }
        
        if (componentMatch) {
            return {
                type: 'get_component',
                component: componentMatch
            };
        }
        
        if (q.includes('搜索') || q.includes('找') || q.includes('查找')) {
            return {
                type: 'search',
                query: this.extractSearchQuery(question)
            };
        }
        
        if (q.includes('列表') || q.includes('所有') || q.includes('组件有哪些')) {
            return {
                type: 'list',
                category: this.extractCategory(question)
            };
        }
        
        if (q.includes('统计') || q.includes('总共') || q.includes('多少个')) {
            return { type: 'stats' };
        }
        
        return {
            type: 'search',
            query: question
        };
    }

    /**
     * 提取组件名称
     */
    private extractComponentName(question: string): string | undefined {
        const components = this.dataLoader.getAllComponents().map(c => c.name);
        
        for (const component of components) {
            if (question.toLowerCase().includes(component.toLowerCase())) {
                return component;
            }
        }
        
        return undefined;
    }

    /**
     * 提取使用场景
     */
    private extractScenario(question: string): string | undefined {
        const scenarios = ['基础用法', '表单验证', '高级配置', '事件处理', '自定义样式'];
        
        for (const scenario of scenarios) {
            if (question.includes(scenario)) {
                return scenario;
            }
        }
        
        return undefined;
    }

    /**
     * 提取属性信息
     */
    private extractProps(question: string): any {
        // 简化实现，实际可以用更复杂的NLP
        try {
            const propsMatch = question.match(/\{[^}]+\}/);
            if (propsMatch) {
                return JSON.parse(propsMatch[0]);
            }
        } catch (e) {
            // 忽略解析错误
        }
        
        return {};
    }

    /**
     * 提取搜索关键词
     */
    private extractSearchQuery(question: string): string {
        // 移除常见的问句词汇
        return question
            .replace(/如何|怎么|什么是|哪个|搜索|找|查找/g, '')
            .trim();
    }

    /**
     * 提取分类
     */
    private extractCategory(question: string): string | undefined {
        const categories = this.dataLoader.getAvailableCategories();
        
        for (const category of categories) {
            if (question.includes(category)) {
                return category;
            }
        }
        
        return undefined;
    }

    /**
     * 获取组件信息
     */
    private getComponentInfo(componentName: string): string {
        const component = this.dataLoader.getComponent(componentName);
        if (!component) {
            const suggestions = this.dataLoader.searchComponents(componentName, { fuzzy: true })
                .slice(0, 3)
                .map(c => c.name)
                .join(', ');
            
            return `没有找到组件 "${componentName}"。您是否想要查找：${suggestions}？`;
        }
        
        return this.formatter.formatComponentAPI(component);
    }

    /**
     * 搜索组件
     */
    private searchComponents(query: string): string {
        const results = this.dataLoader.searchComponents(query, { fuzzy: true });
        return this.formatter.formatSearchResults(results, query);
    }

    /**
     * 验证使用方式
     */
    private validateUsage(componentName: string, props: any): string {
        const component = this.dataLoader.getComponent(componentName);
        if (!component) {
            return `组件 "${componentName}" 不存在，无法验证。`;
        }
        
        const result = this.validator.validate(component, props);
        return this.formatter.formatValidationResult(result);
    }

    /**
     * 获取示例
     */
    private getExamples(componentName: string, scenario?: string): string {
        const component = this.dataLoader.getComponent(componentName);
        if (!component) {
            return `组件 "${componentName}" 不存在，无法生成示例。`;
        }
        
        let examples = component.examples || [];
        
        if (scenario && examples.length === 0) {
            const generated = this.exampleGenerator.generateExampleByScenario(component, scenario);
            if (generated) {
                examples = [generated];
            }
        }
        
        if (examples.length === 0) {
            const basic = this.exampleGenerator.generateBasicExample(component);
            examples = [basic];
        }
        
        return this.formatter.formatExamples(examples);
    }

    /**
     * 列出组件
     */
    private listComponents(category?: string): string {
        let components;
        let title = '所有组件';
        
        if (category) {
            components = this.dataLoader.getComponentsByCategory(category);
            title = category;
        } else {
            components = this.dataLoader.getAllComponents();
        }
        
        return this.formatter.formatComponentList(components, title);
    }

    /**
     * 获取统计信息
     */
    private getStats(): string {
        const stats = this.dataLoader.getStats();
        return this.formatter.formatStats(stats);
    }

    /**
     * 处理一般性问题
     */
    private handleGeneralQuestion(question: string): string {
        return `我是KPC组件库助手。您可以问我：
- 某个组件的详细信息（如："Button组件有哪些属性？"）
- 搜索相关组件（如："搜索表单相关组件"）
- 使用示例（如："Form组件如何使用？"）
- 验证用法（如："验证这个Button配置是否正确"）
- 组件列表（如："所有基础组件有哪些？"）

您的问题："${question}" 我没有完全理解，请提供更具体的信息。`;
    }
}