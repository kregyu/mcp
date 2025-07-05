/**
 * KPC组件API格式化工具
 * 负责将组件数据格式化为markdown文档
 */

import type { 
  ComponentAPI, 
  PropDefinition, 
  EventDefinition, 
  MethodDefinition, 
  SlotDefinition, 
  UsageExample,
  NestingRule 
} from './types.js';

export class KPCFormatter {
  /**
   * 格式化组件完整API文档
   */
  formatComponentAPI(component: ComponentAPI): string {
    const sections = [
      this.formatHeader(component),
      this.formatImports(component),
      this.formatProps(component.props),
      this.formatEvents(component.events),
      this.formatMethods(component.methods),
      this.formatSlots(component.slots),
      this.formatExamples(component.examples),
      this.formatNestingRules(component.nestingRules),
      this.formatDependencies(component.dependencies)
    ].filter(section => section.trim().length > 0);

    return sections.join('\n\n');
  }

  /**
   * 格式化组件头部信息
   */
  private formatHeader(component: ComponentAPI): string {
    return `# ${component.name} 组件API

## 基本信息
- **分类**: ${component.category}
- **描述**: ${component.description}
- **标签**: ${component.tags.join(', ') || '无'}`;
  }

  /**
   * 格式化导入方式
   */
  private formatImports(component: ComponentAPI): string {
    return `## 导入方式
\`\`\`typescript
// Vue 3
import { ${component.name} } from '@king-design/vue';

// Vue 2  
import { ${component.name} } from '@king-design/vue-legacy';

// React
import { ${component.name} } from '@king-design/react';
\`\`\``;
  }

  /**
   * 格式化Props属性表格
   */
  formatProps(props: PropDefinition[]): string {
    if (!props || props.length === 0) return '## Props 属性\n\n无';

    const header = '## Props 属性\n\n| 属性 | 类型 | 默认值 | 必需 | 描述 |\n|------|------|--------|------|------|';
    const rows = props.map(prop => {
      const defaultValue = prop.defaultValue !== undefined ? 
        `\`${JSON.stringify(prop.defaultValue)}\`` : 
        '`undefined`';
      const required = prop.required ? '✅' : '❌';
      const deprecated = prop.deprecated ? ' (已废弃)' : '';
      
      return `| \`${prop.name}\` | \`${prop.type}\` | ${defaultValue} | ${required} | ${prop.description || '-'}${deprecated} |`;
    });

    return [header, ...rows].join('\n');
  }

  /**
   * 格式化Events事件表格
   */
  formatEvents(events: EventDefinition[]): string {
    if (!events || events.length === 0) return '## Events 事件\n\n无';

    const header = '## Events 事件\n\n| 事件 | 参数 | 描述 |\n|------|------|------|';
    const rows = events.map(event => {
      const params = event.parameters?.map(p => `${p.name}: ${p.type}`).join(', ') || '';
      const deprecated = event.deprecated ? ' (已废弃)' : '';
      
      return `| \`@${event.name}\` | \`${params}\` | ${event.description || '-'}${deprecated} |`;
    });

    return [header, ...rows].join('\n');
  }

  /**
   * 格式化Methods方法表格
   */
  formatMethods(methods: MethodDefinition[]): string {
    if (!methods || methods.length === 0) return '## Methods 方法\n\n无';

    const header = '## Methods 方法\n\n| 方法 | 参数 | 返回值 | 描述 |\n|------|------|--------|------|';
    const rows = methods.map(method => {
      const params = method.parameters?.map(p => 
        `${p.name}${p.optional ? '?' : ''}: ${p.type}`
      ).join(', ') || '';
      
      return `| \`${method.name}()\` | \`${params}\` | \`${method.returnType}\` | ${method.description || '-'} |`;
    });

    return [header, ...rows].join('\n');
  }

  /**
   * 格式化Slots插槽表格
   */
  formatSlots(slots: SlotDefinition[]): string {
    if (!slots || slots.length === 0) return '## Slots 插槽\n\n无';

    const header = '## Slots 插槽\n\n| 插槽 | 参数 | 描述 |\n|------|------|------|';
    const rows = slots.map(slot => {
      const params = slot.parameters?.map(p => `${p.name}: ${p.type}`).join(', ') || '';
      return `| \`#${slot.name}\` | \`${params}\` | ${slot.description || '-'} |`;
    });

    return [header, ...rows].join('\n');
  }

  /**
   * 格式化使用示例
   */
  formatExamples(examples: UsageExample[]): string {
    if (!examples || examples.length === 0) return '## 使用示例\n\n暂无示例';

    const exampleSections = examples.map(example => {
      const scenarioText = example.scenario ? `\n\n**场景**: ${example.scenario}` : '';
      const descriptionText = example.description ? `\n\n**说明**: ${example.description}` : '';
      
      return `### ${example.title}${scenarioText}${descriptionText}

\`\`\`vue
${example.code}
\`\`\``;
    });

    return `## 使用示例\n\n${exampleSections.join('\n\n')}`;
  }

  /**
   * 格式化嵌套规则
   */
  private formatNestingRules(rules: NestingRule[]): string {
    if (!rules || rules.length === 0) return '';

    const ruleTexts = rules.map(rule => {
      const requiredText = rule.children.required.length > 0 ? 
        `\n  - **必需子组件**: ${rule.children.required.join(', ')}` : '';
      const allowedText = rule.children.allowed.length > 0 ? 
        `\n  - **允许子组件**: ${rule.children.allowed.join(', ')}` : '';
      const forbiddenText = rule.children.forbidden.length > 0 ? 
        `\n  - **禁止子组件**: ${rule.children.forbidden.join(', ')}` : '';
      
      return `- **${rule.parent}**: ${rule.description}${requiredText}${allowedText}${forbiddenText}`;
    });

    return `## 嵌套规则\n\n${ruleTexts.join('\n\n')}`;
  }

  /**
   * 格式化依赖组件
   */
  private formatDependencies(dependencies: string[]): string {
    if (!dependencies || dependencies.length === 0) return '## 依赖组件\n\n无';

    return `## 依赖组件\n\n${dependencies.join(', ')}`;
  }

  /**
   * 格式化组件列表
   */
  formatComponentList(components: any[], title: string = '组件列表'): string {
    if (!components || components.length === 0) return `# ${title}\n\n暂无组件`;

    // 按分类分组
    const grouped = new Map<string, any[]>();
    components.forEach(comp => {
      if (!grouped.has(comp.category)) {
        grouped.set(comp.category, []);
      }
      grouped.get(comp.category)!.push(comp);
    });

    const sections = Array.from(grouped.entries()).map(([category, comps]) => {
      const componentItems = comps.map(comp => 
        `- **${comp.name}**: ${comp.description}`
      ).join('\n');
      
      return `## ${category} (${comps.length}个)\n\n${componentItems}`;
    });

    return `# ${title} (共${components.length}个)\n\n${sections.join('\n\n')}`;
  }

  /**
   * 格式化搜索结果
   */
  formatSearchResults(components: any[], query: string): string {
    if (components.length === 0) {
      return `没有找到与 "${query}" 相关的组件。

可尝试以下搜索词：
- 组件名称（如：Button、Input、Table）
- 功能描述（如：按钮、输入框、表格）
- 中文标签（如：表单、数据展示、导航）`;
    }

    const resultItems = components.map(comp => {
      const tagsText = comp.tags.length > 0 ? `\n  - **标签**: ${comp.tags.join(', ')}` : '';
      
      return `## ${comp.name}
- **分类**: ${comp.category}
- **描述**: ${comp.description}${tagsText}

使用 \`get_kpc_component\` 工具获取 ${comp.name} 的详细API。`;
    });

    return `找到 ${components.length} 个与 "${query}" 相关的组件：

${resultItems.join('\n\n')}`;
  }

  /**
   * 格式化验证结果
   */
  formatValidationResult(result: { isValid: boolean; errors: any[]; suggestions: string[] }): string {
    if (result.isValid) {
      return '✅ 组件使用正确！';
    }

    const errorItems = result.errors.map(error => `- ${error.message}`).join('\n');
    const suggestionItems = result.suggestions.map(suggestion => `- ${suggestion}`).join('\n');

    return `❌ 发现以下问题：

${errorItems}

## 修复建议：
${suggestionItems}`;
  }

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
  }): string {
    const categoryItems = Object.entries(stats.categories)
      .map(([category, count]) => `- ${category}: ${count}个`)
      .join('\n');

    return `# KPC组件库统计信息

## 总体统计
- **组件总数**: ${stats.totalComponents}个
- **属性总数**: ${stats.totalProps}个
- **事件总数**: ${stats.totalEvents}个
- **方法总数**: ${stats.totalMethods}个
- **示例总数**: ${stats.totalExamples}个

## 分类统计
${categoryItems}`;
  }

  /**
   * 格式化快速参考
   */
  formatQuickReference(component: ComponentAPI): string {
    const commonProps = component.props.slice(0, 5);
    const commonEvents = component.events.slice(0, 3);

    const propsText = commonProps.length > 0 ? 
      commonProps.map(p => `- \`${p.name}\`: ${p.description || p.type}`).join('\n') :
      '无';

    const eventsText = commonEvents.length > 0 ?
      commonEvents.map(e => `- \`@${e.name}\`: ${e.description || '事件'}`).join('\n') :
      '无';

    return `# ${component.name} 快速参考

## 常用属性
${propsText}

## 常用事件
${eventsText}

## 基本用法
\`\`\`vue
<${component.name} v-model="value" />
\`\`\`

使用 \`get_kpc_component\` 获取完整API文档。`;
  }
}