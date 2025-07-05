/**
 * KPC组件使用验证器
 * 验证组件属性、嵌套关系等是否正确
 */

import type { 
  ComponentAPI, 
  ValidationResult, 
  ValidationError,
  NestingRule 
} from './types.js';

export class KPCUsageValidator {
  private nestingRules: Map<string, NestingRule[]> = new Map();

  constructor() {
    this.initializeNestingRules();
  }

  /**
   * 验证组件使用是否正确
   */
  validate(
    component: ComponentAPI, 
    props: Record<string, any>, 
    context?: string
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const suggestions: string[] = [];

    // 1. 验证必需属性
    this.validateRequiredProps(component, props, errors, suggestions);

    // 2. 验证属性是否存在
    this.validatePropExists(component, props, errors, suggestions);

    // 3. 验证属性类型（简化版）
    this.validatePropTypes(component, props, errors, suggestions);

    // 4. 验证嵌套关系
    if (context) {
      this.validateNesting(component, context, errors, suggestions);
    }

    // 5. 验证特殊规则
    this.validateSpecialRules(component, props, context, errors, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    };
  }

  /**
   * 验证必需属性
   */
  private validateRequiredProps(
    component: ComponentAPI,
    props: Record<string, any>,
    errors: ValidationError[],
    suggestions: string[]
  ): void {
    const requiredProps = component.props.filter(p => p.required);
    
    for (const requiredProp of requiredProps) {
      if (!(requiredProp.name in props)) {
        errors.push({
          type: 'missing-required-prop',
          message: `缺少必需属性: ${requiredProp.name}`,
          property: requiredProp.name
        });
        
        const defaultValue = requiredProp.defaultValue !== undefined 
          ? requiredProp.defaultValue 
          : this.getDefaultValueByType(requiredProp.type);
          
        suggestions.push(`添加属性: :${requiredProp.name}="${defaultValue}"`);
      }
    }
  }

  /**
   * 验证属性是否存在
   */
  private validatePropExists(
    component: ComponentAPI,
    props: Record<string, any>,
    errors: ValidationError[],
    suggestions: string[]
  ): void {
    for (const propName of Object.keys(props)) {
      // 跳过以:开头的动态属性和@开头的事件
      if (propName.startsWith(':') || propName.startsWith('@') || propName.startsWith('v-')) {
        continue;
      }

      const propDef = component.props.find(p => p.name === propName);
      if (!propDef) {
        errors.push({
          type: 'unknown-prop',
          message: `未知属性: ${propName}`,
          property: propName
        });
        
        // 尝试找到相似的属性名
        const similarProp = this.findSimilarProp(propName, component.props.map(p => p.name));
        if (similarProp) {
          suggestions.push(`是否想使用: ${similarProp}?`);
        } else {
          suggestions.push(`移除未知属性: ${propName}`);
        }
      }
    }
  }

  /**
   * 验证属性类型（简化版）
   */
  private validatePropTypes(
    component: ComponentAPI,
    props: Record<string, any>,
    errors: ValidationError[],
    suggestions: string[]
  ): void {
    for (const [propName, propValue] of Object.entries(props)) {
      const propDef = component.props.find(p => p.name === propName);
      if (!propDef) continue;

      const isValidType = this.validateType(propValue, propDef.type);
      if (!isValidType) {
        errors.push({
          type: 'invalid-prop-type',
          message: `属性 ${propName} 类型错误，期望 ${propDef.type}`,
          property: propName
        });
        suggestions.push(`修正属性类型: ${propName} 应该是 ${propDef.type}`);
      }
    }
  }

  /**
   * 验证嵌套关系
   */
  private validateNesting(
    component: ComponentAPI,
    context: string,
    errors: ValidationError[],
    suggestions: string[]
  ): void {
    const contextRules = this.nestingRules.get(context);
    if (!contextRules) return;

    for (const rule of contextRules) {
      if (rule.mandatory) {
        // 检查是否允许当前组件
        if (!rule.children.allowed.includes(component.name)) {
          errors.push({
            type: 'invalid-nesting',
            message: `${component.name} 不能直接放在 ${context} 中`,
            property: 'nesting'
          });
          
          if (rule.children.required.length > 0) {
            suggestions.push(`将 ${component.name} 包裹在 ${rule.children.required[0]} 中`);
          }
        }

        // 检查是否在禁止列表中
        if (rule.children.forbidden.includes(component.name)) {
          errors.push({
            type: 'invalid-nesting',
            message: `${component.name} 不能放在 ${context} 中`,
            property: 'nesting'
          });
          suggestions.push(`${rule.description}`);
        }
      }
    }
  }

  /**
   * 验证特殊规则
   */
  private validateSpecialRules(
    component: ComponentAPI,
    props: Record<string, any>,
    context: string | undefined,
    errors: ValidationError[],
    suggestions: string[]
  ): void {
    // FormItem特殊规则
    if (component.name === 'FormItem' && context === 'Form') {
      if (!props.value && !props[':value']) {
        errors.push({
          type: 'missing-required-prop',
          message: 'FormItem 需要配置 :value 属性才能启用验证',
          property: 'value'
        });
        suggestions.push('添加 :value 属性绑定到对应的数据字段');
      }
    }

    // Table特殊规则
    if (component.name === 'Table') {
      if (!props.data && !props[':data']) {
        errors.push({
          type: 'missing-required-prop',
          message: 'Table 组件需要 data 属性',
          property: 'data'
        });
        suggestions.push('添加 :data 属性绑定表格数据');
      }
    }

    // 检查已废弃的属性
    for (const propName of Object.keys(props)) {
      const propDef = component.props.find(p => p.name === propName);
      if (propDef?.deprecated) {
        errors.push({
          type: 'unknown-prop',
          message: `属性 ${propName} 已废弃`,
          property: propName
        });
        suggestions.push(`属性 ${propName} 已废弃，请查看文档使用替代方案`);
      }
    }
  }

  /**
   * 类型验证（简化版）
   */
  private validateType(value: any, expectedType: string): boolean {
    // 简化的类型验证
    switch (expectedType.toLowerCase()) {
      case 'boolean':
        return typeof value === 'boolean';
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null;
      case 'function':
        return typeof value === 'function';
      default:
        // 对于复杂类型，暂时通过
        return true;
    }
  }

  /**
   * 获取类型的默认值
   */
  private getDefaultValueByType(type: string): string {
    switch (type.toLowerCase()) {
      case 'boolean':
        return 'false';
      case 'string':
        return '""';
      case 'number':
        return '0';
      case 'array':
        return '[]';
      case 'object':
        return '{}';
      default:
        return 'undefined';
    }
  }

  /**
   * 查找相似的属性名
   */
  private findSimilarProp(target: string, propNames: string[]): string | null {
    const threshold = 0.6;
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const propName of propNames) {
      const score = this.calculateSimilarity(target, propName);
      if (score > threshold && score > bestScore) {
        bestScore = score;
        bestMatch = propName;
      }
    }

    return bestMatch;
  }

  /**
   * 计算字符串相似度
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return (maxLength - distance) / maxLength;
  }

  /**
   * 计算编辑距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array.from({ length: str1.length + 1 }, () => 
      Array.from({ length: str2.length + 1 }, () => 0)
    );

    for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[str1.length][str2.length];
  }

  /**
   * 初始化嵌套规则
   */
  private initializeNestingRules(): void {
    // Form嵌套规则
    this.nestingRules.set('Form', [{
      parent: 'Form',
      children: {
        required: ['FormItem'],
        allowed: ['FormItem', 'div', 'Button'],
        forbidden: ['Input', 'Select', 'Checkbox', 'Radio', 'Spinner', 'Upload', 'DatePicker']
      },
      mandatory: true,
      description: 'Form组件内的表单控件必须使用FormItem包裹'
    }]);

    // Table嵌套规则
    this.nestingRules.set('Table', [{
      parent: 'Table',
      children: {
        required: ['TableColumn'],
        allowed: ['TableColumn'],
        forbidden: []
      },
      mandatory: true,
      description: 'Table组件必须包含TableColumn定义列'
    }]);

    // Menu嵌套规则
    this.nestingRules.set('Menu', [{
      parent: 'Menu',
      children: {
        required: ['MenuItem'],
        allowed: ['MenuItem', 'MenuTitle', 'Divider'],
        forbidden: []
      },
      mandatory: true,
      description: 'Menu组件必须包含MenuItem或MenuTitle'
    }]);

    // Tabs嵌套规则
    this.nestingRules.set('Tabs', [{
      parent: 'Tabs',
      children: {
        required: ['Tab'],
        allowed: ['Tab'],
        forbidden: []
      },
      mandatory: true,
      description: 'Tabs组件必须包含Tab定义标签页'
    }]);

    // Collapse嵌套规则
    this.nestingRules.set('Collapse', [{
      parent: 'Collapse',
      children: {
        required: ['CollapseItem'],
        allowed: ['CollapseItem'],
        forbidden: []
      },
      mandatory: true,
      description: 'Collapse组件必须包含CollapseItem'
    }]);

    // Steps嵌套规则
    this.nestingRules.set('Steps', [{
      parent: 'Steps',
      children: {
        required: ['Step'],
        allowed: ['Step'],
        forbidden: []
      },
      mandatory: true,
      description: 'Steps组件必须包含Step定义步骤'
    }]);
  }
}