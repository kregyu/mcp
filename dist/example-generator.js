/**
 * KPC组件使用示例生成器
 * 自动生成组件的使用示例代码
 */
export class KPCExampleGenerator {
    /**
     * 生成组件的基础使用示例
     */
    generateBasicExample(component) {
        const props = this.selectBasicProps(component.props);
        const events = component.events.slice(0, 2);
        const propsCode = this.generatePropsCode(props);
        const eventsCode = this.generateEventsCode(events);
        let templateCode = `<${component.name}`;
        if (propsCode)
            templateCode += `\n  ${propsCode}`;
        if (eventsCode)
            templateCode += `\n  ${eventsCode}`;
        if (component.slots && component.slots.length > 0) {
            const slotContent = this.generateSlotContent(component);
            templateCode += `>\n  ${slotContent}\n</${component.name}>`;
        }
        else {
            templateCode += ' />';
        }
        const scriptCode = this.generateScriptCode(component, props, events);
        let code = `<template>\n  ${templateCode}\n</template>`;
        // 只有当有事件或需要响应式数据时才添加script部分
        if (events.length > 0 || this.hasReactiveProps(props)) {
            code += `\n\n${scriptCode}`;
        }
        return {
            title: '基础用法',
            description: `${component.name}组件的基本使用方式`,
            scenario: '基础用法',
            code,
            framework: 'vue3',
            complexity: 'basic'
        };
    }
    /**
     * 生成表单场景示例
     */
    generateFormExample(component) {
        if (!this.isFormComponent(component))
            return null;
        const formCode = `<template>
  <Form @submit="handleSubmit" ref="formRef" labelWidth="120">
    <FormItem label="${component.description}" :value="form.${component.name.toLowerCase()}" :rules="rules.${component.name.toLowerCase()}">
      ${this.generateFormComponentCode(component)}
    </FormItem>
    
    <FormItem>
      <Button type="primary" htmlType="submit">提交</Button>
      <Button @click="handleReset" style="margin-left: 8px">重置</Button>
    </FormItem>
  </Form>
</template>

<script>
import { Form, FormItem, ${component.name}, Button } from '@king-design/vue';

export default {
  components: {
    Form,
    FormItem,
    ${component.name},
    Button
  },
  
  data() {
    return {
      form: {
        ${component.name.toLowerCase()}: ${this.getDefaultFormValue(component)}
      },
      rules: {
        ${component.name.toLowerCase()}: ${this.generateValidationRules(component)}
      }
    };
  },
  
  methods: {
    handleSubmit() {
      console.log('表单提交:', this.form);
    },
    
    handleReset() {
      this.form.${component.name.toLowerCase()} = ${this.getDefaultFormValue(component)};
      this.$refs.formRef.reset();
    }
  }
};
</script>`;
        return {
            title: '表单使用',
            description: `在表单中使用${component.name}组件`,
            scenario: '表单验证',
            code: formCode,
            framework: 'vue3',
            complexity: 'intermediate'
        };
    }
    /**
     * 生成高级配置示例
     */
    generateAdvancedExample(component) {
        const allProps = component.props.filter(p => !p.required);
        const selectedProps = allProps.slice(0, 6); // 选择前6个非必需属性
        const propsCode = selectedProps.map(prop => {
            const value = this.getAdvancedPropValue(prop);
            return `:${prop.name}="${value}"`;
        }).join('\n  ');
        const eventsCode = component.events.map(event => `@${event.name}="handle${this.capitalize(event.name)}"`).join('\n  ');
        let templateCode = `<${component.name}`;
        if (propsCode)
            templateCode += `\n  ${propsCode}`;
        if (eventsCode)
            templateCode += `\n  ${eventsCode}`;
        templateCode += `>\n  高级配置示例\n</${component.name}>`;
        const methodsCode = component.events.map(event => `    handle${this.capitalize(event.name)}(${this.getEventParams(event)}) {
      console.log('${event.name} event:', arguments);
    }`).join(',\n\n');
        const code = `<template>
  ${templateCode}
</template>

<script>
import { ${component.name} } from '@king-design/vue';

export default {
  components: {
    ${component.name}
  },
  
  data() {
    return {
      ${this.generateAdvancedDataProperties(selectedProps)}
    };
  },
  
  methods: {
${methodsCode}
  }
};
</script>`;
        return {
            title: '高级配置',
            description: `${component.name}组件的高级配置选项`,
            scenario: '高级用法',
            code,
            framework: 'vue3',
            complexity: 'advanced'
        };
    }
    /**
     * 根据场景生成示例
     */
    generateExampleByScenario(component, scenario) {
        switch (scenario.toLowerCase()) {
            case '基础用法':
            case 'basic':
                return this.generateBasicExample(component);
            case '表单验证':
            case 'form':
                return this.generateFormExample(component);
            case '高级用法':
            case 'advanced':
                return this.generateAdvancedExample(component);
            case '事件处理':
            case 'events':
                return this.generateEventExample(component);
            default:
                return this.generateBasicExample(component);
        }
    }
    /**
     * 生成事件处理示例
     */
    generateEventExample(component) {
        if (component.events.length === 0) {
            return this.generateBasicExample(component);
        }
        const eventsCode = component.events.map(event => `@${event.name}="handle${this.capitalize(event.name)}"`).join('\n  ');
        const templateCode = `<${component.name}\n  ${eventsCode}\n>\n  事件处理示例\n</${component.name}>`;
        const methodsCode = component.events.map(event => {
            const description = event.description || `处理${event.name}事件`;
            return `    handle${this.capitalize(event.name)}(${this.getEventParams(event)}) {
      // ${description}
      console.log('${event.name} event triggered:', arguments);
    }`;
        }).join(',\n\n');
        const code = `<template>
  ${templateCode}
</template>

<script>
import { ${component.name} } from '@king-design/vue';

export default {
  components: {
    ${component.name}
  },
  
  methods: {
${methodsCode}
  }
};
</script>`;
        return {
            title: '事件处理',
            description: `${component.name}组件的事件处理示例`,
            scenario: '事件处理',
            code,
            framework: 'vue3',
            complexity: 'intermediate'
        };
    }
    /**
     * 选择基础属性
     */
    selectBasicProps(props) {
        // 优先选择必需属性和常用属性
        const priorityProps = ['value', 'size', 'disabled', 'placeholder', 'type'];
        const required = props.filter(p => p.required);
        const common = props.filter(p => priorityProps.includes(p.name));
        return [...required, ...common].slice(0, 5);
    }
    /**
     * 生成属性代码
     */
    generatePropsCode(props) {
        return props.map(prop => {
            if (prop.name === 'value') {
                return 'v-model="value"';
            }
            const value = this.getPropValue(prop);
            return prop.type === 'boolean' ?
                `:${prop.name}="${value}"` :
                `${prop.name}="${value}"`;
        }).join('\n  ');
    }
    /**
     * 生成事件代码
     */
    generateEventsCode(events) {
        return events.map(event => `@${event.name}="handle${this.capitalize(event.name)}"`).join('\n  ');
    }
    /**
     * 生成脚本代码
     */
    generateScriptCode(component, props, events) {
        const methodsCode = events.length > 0 ? `,
  
  methods: {
    ${events.map(event => `handle${this.capitalize(event.name)}() {
      console.log('${event.name} event triggered');
    }`).join(',\n    ')}
  }` : '';
        return `<script>
import { ${component.name} } from '@king-design/vue';

export default {
  components: {
    ${component.name}
  },
  
  data() {
    return {
      value: ${this.getDefaultDataValue(component)}
    };
  }${methodsCode}
};
</script>`;
    }
    /**
     * 获取属性值
     */
    getPropValue(prop) {
        if (prop.defaultValue !== undefined) {
            return typeof prop.defaultValue === 'string' ? prop.defaultValue : String(prop.defaultValue);
        }
        switch (prop.type.toLowerCase()) {
            case 'boolean':
                return 'false';
            case 'string':
                return prop.name === 'placeholder' ? '请输入' : '示例值';
            case 'number':
                return '0';
            default:
                return prop.options.length > 0 ? prop.options[0] : 'undefined';
        }
    }
    /**
     * 获取高级属性值
     */
    getAdvancedPropValue(prop) {
        if (prop.options.length > 0) {
            return prop.options[Math.min(1, prop.options.length - 1)];
        }
        switch (prop.type.toLowerCase()) {
            case 'boolean':
                return 'true';
            case 'string':
                return `advanced${this.capitalize(prop.name)}`;
            case 'number':
                return '100';
            case 'array':
                return '[]';
            case 'object':
                return '{}';
            default:
                return 'undefined';
        }
    }
    /**
     * 获取默认数据值
     */
    getDefaultDataValue(component) {
        const valueProp = component.props.find(p => p.name === 'value');
        if (!valueProp)
            return "''";
        switch (valueProp.type.toLowerCase()) {
            case 'string':
                return "''";
            case 'number':
                return '0';
            case 'boolean':
                return 'false';
            case 'array':
                return '[]';
            default:
                return "''";
        }
    }
    /**
     * 判断是否为表单组件
     */
    isFormComponent(component) {
        return component.category === '表单组件' &&
            component.name !== 'Form' &&
            component.name !== 'FormItem';
    }
    /**
     * 生成表单组件代码
     */
    generateFormComponentCode(component) {
        const basicProps = this.selectBasicProps(component.props);
        const propsCode = basicProps.map(prop => {
            if (prop.name === 'value') {
                return `v-model="form.${component.name.toLowerCase()}"`;
            }
            return `${prop.name}="${this.getPropValue(prop)}"`;
        }).join(' ');
        return `<${component.name} ${propsCode} />`;
    }
    /**
     * 获取表单默认值
     */
    getDefaultFormValue(component) {
        const valueProp = component.props.find(p => p.name === 'value');
        if (!valueProp)
            return "''";
        switch (component.name) {
            case 'Checkbox':
                return 'false';
            case 'Spinner':
                return '0';
            case 'Switch':
                return 'false';
            case 'Rate':
                return '0';
            case 'Select':
                return 'undefined';
            default:
                return "''";
        }
    }
    /**
     * 生成验证规则
     */
    generateValidationRules(component) {
        const rules = ['{ required: true }'];
        switch (component.name) {
            case 'Input':
                rules.push('{ minLength: 2 }');
                break;
            case 'Spinner':
                rules.push('{ min: 0, max: 100 }');
                break;
        }
        return `[${rules.join(', ')}]`;
    }
    /**
     * 生成高级数据属性
     */
    generateAdvancedDataProperties(props) {
        return props.map(prop => {
            const value = this.getAdvancedPropValue(prop);
            return `      ${prop.name}: ${JSON.stringify(value)}`;
        }).join(',\n');
    }
    /**
     * 获取事件参数
     */
    getEventParams(event) {
        if (!event.parameters || event.parameters.length === 0) {
            return '';
        }
        return event.parameters.map((p) => p.name || 'event').join(', ');
    }
    /**
     * 生成插槽内容
     */
    generateSlotContent(component) {
        switch (component.name) {
            case 'Button':
                return '点击按钮';
            case 'Card':
                return 'Card内容';
            case 'Dialog':
                return '这是一个对话框内容';
            case 'Modal':
                return '模态框内容';
            case 'Drawer':
                return '抽屉内容';
            case 'Tooltip':
                return 'Hover显示提示';
            case 'Popover':
                return '点击显示气泡';
            case 'Collapse':
                return 'CollapseItem内容';
            case 'Tabs':
                return 'Tab内容';
            case 'Steps':
                return 'Step内容';
            default:
                return `${component.name}内容`;
        }
    }
    /**
     * 检查是否有需要响应式数据的属性
     */
    hasReactiveProps(props) {
        return props.some(prop => prop.name === 'value' ||
            prop.name.includes('model') ||
            prop.type === 'boolean' && ['checked', 'selected', 'active'].includes(prop.name));
    }
    /**
     * 首字母大写
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
//# sourceMappingURL=example-generator.js.map