/**
 * KPC组件API格式化工具
 * 负责将组件数据格式化为markdown文档
 */
import type { ComponentAPI, PropDefinition, EventDefinition, MethodDefinition, SlotDefinition, UsageExample } from './types.js';
export declare class KPCFormatter {
    /**
     * 格式化组件完整API文档
     */
    formatComponentAPI(component: ComponentAPI): string;
    /**
     * 格式化组件头部信息
     */
    private formatHeader;
    /**
     * 格式化导入方式
     */
    private formatImports;
    /**
     * 格式化Props属性表格
     */
    formatProps(props: PropDefinition[]): string;
    /**
     * 格式化Events事件表格
     */
    formatEvents(events: EventDefinition[]): string;
    /**
     * 格式化Methods方法表格
     */
    formatMethods(methods: MethodDefinition[]): string;
    /**
     * 格式化Slots插槽表格
     */
    formatSlots(slots: SlotDefinition[]): string;
    /**
     * 格式化使用示例
     */
    formatExamples(examples: UsageExample[]): string;
    /**
     * 格式化嵌套规则
     */
    private formatNestingRules;
    /**
     * 格式化依赖组件
     */
    private formatDependencies;
    /**
     * 格式化组件列表
     */
    formatComponentList(components: any[], title?: string): string;
    /**
     * 格式化搜索结果
     */
    formatSearchResults(components: any[], query: string): string;
    /**
     * 格式化验证结果
     */
    formatValidationResult(result: {
        isValid: boolean;
        errors: any[];
        suggestions: string[];
    }): string;
    /**
     * 格式化统计信息
     */
    formatStats(stats: {
        totalComponents: number;
        totalProps: number;
        totalEvents: number;
        totalMethods: number;
        totalExamples: number;
        categories: Record<string, number>;
    }): string;
    /**
     * 格式化快速参考
     */
    formatQuickReference(component: ComponentAPI): string;
}
//# sourceMappingURL=formatters.d.ts.map