/**
 * KPC组件使用示例生成器
 * 自动生成组件的使用示例代码
 */
import type { ComponentAPI, UsageExample } from './types.js';
export declare class KPCExampleGenerator {
    /**
     * 生成组件的基础使用示例
     */
    generateBasicExample(component: ComponentAPI): UsageExample;
    /**
     * 生成表单场景示例
     */
    generateFormExample(component: ComponentAPI): UsageExample | null;
    /**
     * 生成高级配置示例
     */
    generateAdvancedExample(component: ComponentAPI): UsageExample;
    /**
     * 根据场景生成示例
     */
    generateExampleByScenario(component: ComponentAPI, scenario: string): UsageExample | null;
    /**
     * 生成事件处理示例
     */
    private generateEventExample;
    /**
     * 选择基础属性
     */
    private selectBasicProps;
    /**
     * 生成属性代码
     */
    private generatePropsCode;
    /**
     * 生成事件代码
     */
    private generateEventsCode;
    /**
     * 生成脚本代码
     */
    private generateScriptCode;
    /**
     * 获取属性值
     */
    private getPropValue;
    /**
     * 获取高级属性值
     */
    private getAdvancedPropValue;
    /**
     * 获取默认数据值
     */
    private getDefaultDataValue;
    /**
     * 判断是否为表单组件
     */
    private isFormComponent;
    /**
     * 生成表单组件代码
     */
    private generateFormComponentCode;
    /**
     * 获取表单默认值
     */
    private getDefaultFormValue;
    /**
     * 生成验证规则
     */
    private generateValidationRules;
    /**
     * 生成高级数据属性
     */
    private generateAdvancedDataProperties;
    /**
     * 获取事件参数
     */
    private getEventParams;
    /**
     * 首字母大写
     */
    private capitalize;
}
//# sourceMappingURL=example-generator.d.ts.map