/**
 * KPC组件使用验证器
 * 验证组件属性、嵌套关系等是否正确
 */
import type { ComponentAPI, ValidationResult } from './types.js';
export declare class KPCUsageValidator {
    private nestingRules;
    constructor();
    /**
     * 验证组件使用是否正确
     */
    validate(component: ComponentAPI, props: Record<string, any>, context?: string): ValidationResult;
    /**
     * 验证必需属性
     */
    private validateRequiredProps;
    /**
     * 验证属性是否存在
     */
    private validatePropExists;
    /**
     * 验证属性类型（简化版）
     */
    private validatePropTypes;
    /**
     * 验证嵌套关系
     */
    private validateNesting;
    /**
     * 验证特殊规则
     */
    private validateSpecialRules;
    /**
     * 类型验证（简化版）
     */
    private validateType;
    /**
     * 获取类型的默认值
     */
    private getDefaultValueByType;
    /**
     * 查找相似的属性名
     */
    private findSimilarProp;
    /**
     * 计算字符串相似度
     */
    private calculateSimilarity;
    /**
     * 计算编辑距离
     */
    private levenshteinDistance;
    /**
     * 初始化嵌套规则
     */
    private initializeNestingRules;
}
//# sourceMappingURL=validators.d.ts.map