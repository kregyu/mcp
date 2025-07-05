#!/usr/bin/env node

/**
 * KPC组件库API提取工具
 * 从源代码中提取所有组件的API信息，生成标准化的JSON数据文件
 */

const fs = require('fs').promises;
const path = require('path');
const ts = require('typescript');

class KPCAPIExtractor {
  constructor(sourceDir = './components', outputDir = './tools/api-data') {
    this.sourceDir = sourceDir;
    this.outputDir = outputDir;
    this.components = new Map();
    this.globalTypes = new Map();
    
    // 组件分类映射
    this.categoryMap = new Map([
      // 基础组件
      ['Button', '基础组件'],
      ['Icon', '基础组件'],
      ['Badge', '基础组件'],
      ['Divider', '基础组件'],
      ['Wave', '基础组件'],
      
      // 表单组件
      ['Form', '表单组件'],
      ['FormItem', '表单组件'],
      ['Input', '表单组件'],
      ['Checkbox', '表单组件'],
      ['Radio', '表单组件'],
      ['Select', '表单组件'],
      ['Switch', '表单组件'],
      ['Slider', '表单组件'],
      ['Rate', '表单组件'],
      ['Upload', '表单组件'],
      ['Cascader', '表单组件'],
      ['TreeSelect', '表单组件'],
      ['Datepicker', '表单组件'],
      ['Timepicker', '表单组件'],
      ['Colorpicker', '表单组件'],
      ['Spinner', '表单组件'],
      ['ScrollSelect', '表单组件'],
      ['Editable', '表单组件'],
      
      // 数据展示组件
      ['Table', '数据展示'],
      ['Tree', '数据展示'],
      ['Pagination', '数据展示'],
      ['Progress', '数据展示'],
      ['Tag', '数据展示'],
      ['Card', '数据展示'],
      ['Descriptions', '数据展示'],
      ['Timeline', '数据展示'],
      ['Skeleton', '数据展示'],
      ['VirtualList', '数据展示'],
      ['Code', '数据展示'],
      ['Diagram', '数据展示'],
      
      // 导航组件
      ['Menu', '导航组件'],
      ['Breadcrumb', '导航组件'],
      ['Tabs', '导航组件'],
      ['Steps', '导航组件'],
      ['Dropdown', '导航组件'],
      
      // 布局组件
      ['Layout', '布局组件'],
      ['Grid', '布局组件'],
      ['Affix', '布局组件'],
      ['Collapse', '布局组件'],
      ['Carousel', '布局组件'],
      ['Split', '布局组件'],
      
      // 反馈组件
      ['Dialog', '反馈组件'],
      ['Drawer', '反馈组件'],
      ['Message', '反馈组件'],
      ['Tooltip', '反馈组件'],
      ['Popover', '反馈组件'],
      ['Spin', '反馈组件'],
      ['Tip', '反馈组件'],
      ['Tour', '反馈组件'],
      
      // 工具组件
      ['Transfer', '工具组件'],
      ['Copy', '工具组件'],
      ['Ellipsis', '工具组件'],
      ['Config', '工具组件'],
      ['View', '工具组件']
    ]);
    
    // 组件标签映射（用于搜索）
    this.tagsMap = new Map([
      ['Button', ['按钮', '点击', '操作']],
      ['Input', ['输入框', '输入', '文本']],
      ['Spinner', ['数字输入框', '计数器', '数字', '输入']],
      ['Form', ['表单', '验证', '提交']],
      ['FormItem', ['表单项', '验证', '标签']],
      ['Table', ['表格', '数据', '列表', '分页']],
      ['Select', ['选择器', '下拉', '选择']],
      ['Checkbox', ['复选框', '多选', '选中']],
      ['Radio', ['单选框', '单选', '选择']],
      ['Dialog', ['对话框', '弹窗', '模态框']],
      ['Message', ['消息', '提示', '通知']],
      ['Tooltip', ['提示框', '文字提示', '悬停']],
      ['Menu', ['菜单', '导航', '侧边栏']],
      ['Tabs', ['标签页', '选项卡', '切换']],
      ['Pagination', ['分页', '翻页', '页码']],
      ['Upload', ['上传', '文件', '图片']],
      ['DatePicker', ['日期选择器', '日期', '时间']],
      ['Progress', ['进度条', '进度', '加载']]
    ]);
    
    // 嵌套规则定义
    this.nestingRules = new Map([
      ['Form', {
        parent: 'Form',
        children: {
          required: ['FormItem'],
          allowed: ['FormItem', 'div', 'Button'],
          forbidden: ['Input', 'Select', 'Checkbox', 'Radio']
        },
        mandatory: true,
        description: 'Form组件内的表单控件必须使用FormItem包裹'
      }],
      ['FormItem', {
        parent: 'FormItem',
        children: {
          required: [],
          allowed: ['Input', 'Select', 'Checkbox', 'Radio', 'Spinner', 'Upload', 'DatePicker', 'Button'],
          forbidden: []
        },
        mandatory: false,
        description: 'FormItem用于包裹表单控件'
      }],
      ['Table', {
        parent: 'Table',
        children: {
          required: ['TableColumn'],
          allowed: ['TableColumn'],
          forbidden: []
        },
        mandatory: true,
        description: 'Table组件必须包含TableColumn定义列'
      }],
      ['Menu', {
        parent: 'Menu',
        children: {
          required: ['MenuItem'],
          allowed: ['MenuItem', 'MenuTitle', 'Divider'],
          forbidden: []
        },
        mandatory: true,
        description: 'Menu组件必须包含MenuItem或MenuTitle'
      }],
      ['Tabs', {
        parent: 'Tabs',
        children: {
          required: ['Tab'],
          allowed: ['Tab'],
          forbidden: []
        },
        mandatory: true,
        description: 'Tabs组件必须包含Tab定义标签页'
      }],
      ['Collapse', {
        parent: 'Collapse',
        children: {
          required: ['CollapseItem'],
          allowed: ['CollapseItem'],
          forbidden: []
        },
        mandatory: true,
        description: 'Collapse组件必须包含CollapseItem'
      }],
      ['Steps', {
        parent: 'Steps',
        children: {
          required: ['Step'],
          allowed: ['Step'],
          forbidden: []
        },
        mandatory: true,
        description: 'Steps组件必须包含Step定义步骤'
      }]
    ]);
  }
  
  async extract() {
    console.log('🚀 开始提取KPC组件API...');
    
    try {
      // 确保输出目录存在
      await fs.mkdir(this.outputDir, { recursive: true });
      
      // 获取所有组件目录
      const componentDirs = await this.getComponentDirectories();
      console.log(`📦 发现 ${componentDirs.length} 个组件`);
      
      // 并行处理所有组件
      const results = await Promise.allSettled(
        componentDirs.map(dir => this.extractComponent(dir))
      );
      
      // 统计结果
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected');
      
      console.log(`✅ 成功处理 ${successful} 个组件`);
      if (failed.length > 0) {
        console.log(`❌ 失败 ${failed.length} 个组件:`);
        failed.forEach((result, index) => {
          console.log(`  - ${componentDirs[index]}: ${result.reason.message}`);
        });
      }
      
      // 生成最终的API数据文件
      await this.generateAPIData();
      
      console.log('🎉 API提取完成！');
      
    } catch (error) {
      console.error('❌ 提取过程出错:', error);
      process.exit(1);
    }
  }
  
  async getComponentDirectories() {
    const entries = await fs.readdir(this.sourceDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .filter(name => !name.startsWith('.') && !name.startsWith('_'));
  }
  
  async extractComponent(componentName) {
    console.log(`🔍 处理组件: ${componentName}`);
    
    const componentDir = path.join(this.sourceDir, componentName);
    const component = {
      name: this.toPascalCase(componentName),
      description: '',
      category: this.categoryMap.get(this.toPascalCase(componentName)) || '工具组件',
      tags: this.tagsMap.get(this.toPascalCase(componentName)) || [],
      filePath: componentDir,
      props: [],
      events: [],
      methods: [],
      slots: [],
      examples: [],
      nestingRules: [],
      dependencies: []
    };
    
    try {
      // 提取各种API信息
      await Promise.all([
        this.extractPropsAndEvents(componentDir, component),
        this.extractMethods(componentDir, component),
        this.extractSlots(componentDir, component),
        this.extractExamples(componentDir, component),
        this.extractDescription(componentDir, component)
      ]);
      
      // 添加嵌套规则
      if (this.nestingRules.has(component.name)) {
        component.nestingRules.push(this.nestingRules.get(component.name));
      }
      
      this.components.set(component.name, component);
      
    } catch (error) {
      console.error(`  ❌ ${componentName} 处理失败:`, error.message);
      throw error;
    }
  }
  
  async extractPropsAndEvents(componentDir, component) {
    const indexFile = path.join(componentDir, 'index.ts');
    
    if (!await this.fileExists(indexFile)) {
      return;
    }
    
    const sourceCode = await fs.readFile(indexFile, 'utf-8');
    const sourceFile = ts.createSourceFile(
      indexFile,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );
    
    // 查找Props接口
    const propsInterfaceName = `${component.name}Props`;
    const propsInterface = this.findInterface(sourceFile, propsInterfaceName);
    if (propsInterface) {
      component.props = this.parsePropsInterface(propsInterface);
    }
    
    // 查找Events接口
    const eventsInterfaceName = `${component.name}Events`;
    const eventsInterface = this.findInterface(sourceFile, eventsInterfaceName);
    if (eventsInterface) {
      component.events = this.parseEventsInterface(eventsInterface);
    }
  }
  
  async extractMethods(componentDir, component) {
    const indexFile = path.join(componentDir, 'index.ts');
    
    if (!await this.fileExists(indexFile)) {
      return;
    }
    
    const sourceCode = await fs.readFile(indexFile, 'utf-8');
    const sourceFile = ts.createSourceFile(
      indexFile,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );
    
    // 查找组件类
    const classNode = this.findClass(sourceFile, component.name);
    if (classNode) {
      component.methods = this.parseClassMethods(classNode);
    }
  }
  
  async extractSlots(componentDir, component) {
    const vdtFile = path.join(componentDir, 'index.vdt');
    
    if (!await this.fileExists(vdtFile)) {
      return;
    }
    
    const vdtContent = await fs.readFile(vdtFile, 'utf-8');
    component.slots = this.parseVDTSlots(vdtContent);
  }
  
  async extractExamples(componentDir, component) {
    const demosDir = path.join(componentDir, 'demos');
    
    if (!await this.directoryExists(demosDir)) {
      return;
    }
    
    const demoFiles = await fs.readdir(demosDir);
    
    for (const file of demoFiles) {
      if (file.endsWith('.vue') || file.endsWith('.js') || file.endsWith('.ts')) {
        try {
          const example = await this.parseDemoFile(path.join(demosDir, file));
          if (example) {
            component.examples.push(example);
          }
        } catch (error) {
          console.warn(`    ⚠️  解析示例文件失败: ${file}`);
        }
      }
    }
  }
  
  async extractDescription(componentDir, component) {
    const mdFile = path.join(componentDir, 'index.md');
    
    if (!await this.fileExists(mdFile)) {
      return;
    }
    
    try {
      const mdContent = await fs.readFile(mdFile, 'utf-8');
      const lines = mdContent.split('\\n');
      
      // 查找第一个# 标题作为描述
      for (const line of lines) {
        const match = line.match(/^#\\s+(.+)/);
        if (match && !match[1].includes('API')) {
          component.description = match[1].trim();
          break;
        }
      }
      
      // 如果没找到，使用默认描述
      if (!component.description) {
        component.description = `${component.name}组件`;
      }
      
    } catch (error) {
      component.description = `${component.name}组件`;
    }
  }
  
  // TypeScript AST 解析方法
  findInterface(sourceFile, interfaceName) {
    let targetInterface = null;
    
    const visit = (node) => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
        targetInterface = node;
        return;
      }
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return targetInterface;
  }
  
  findClass(sourceFile, className) {
    let targetClass = null;
    
    const visit = (node) => {
      if (ts.isClassDeclaration(node) && node.name?.text === className) {
        targetClass = node;
        return;
      }
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return targetClass;
  }
  
  parsePropsInterface(interfaceNode) {
    const props = [];
    
    for (const member of interfaceNode.members) {
      if (ts.isPropertySignature(member) && member.name) {
        const prop = {
          name: member.name.text,
          type: this.getTypeText(member.type),
          required: !member.questionToken,
          defaultValue: undefined,
          description: this.getJSDocComment(member),
          options: this.extractEnumOptions(member.type)
        };
        
        props.push(prop);
      }
    }
    
    return props;
  }
  
  parseEventsInterface(interfaceNode) {
    const events = [];
    
    for (const member of interfaceNode.members) {
      if (ts.isPropertySignature(member) && member.name) {
        const event = {
          name: member.name.text,
          parameters: this.parseEventParameters(member.type),
          description: this.getJSDocComment(member)
        };
        
        events.push(event);
      }
    }
    
    return events;
  }
  
  parseClassMethods(classNode) {
    const methods = [];
    
    for (const member of classNode.members) {
      if (ts.isMethodDeclaration(member) && member.name) {
        // 只处理公开方法
        const isPublic = !member.modifiers?.some(mod => 
          mod.kind === ts.SyntaxKind.PrivateKeyword || 
          mod.kind === ts.SyntaxKind.ProtectedKeyword
        );
        
        // 跳过内部方法（以_开头）
        const methodName = member.name.text;
        if (isPublic && !methodName.startsWith('_')) {
          const method = {
            name: methodName,
            parameters: this.parseMethodParameters(member.parameters || []),
            returnType: this.getTypeText(member.type) || 'void',
            description: this.getJSDocComment(member),
            access: 'public'
          };
          
          methods.push(method);
        }
      }
    }
    
    return methods;
  }
  
  parseVDTSlots(vdtContent) {
    const slots = [];
    
    // 解析 VDT 模板中的插槽定义
    // 匹配 <b:slotName args={...}> 格式
    const slotRegex = /<b:(\\w+)(?:\\s+args=\\{([^}]*)\\})?>/g;
    
    let match;
    while ((match = slotRegex.exec(vdtContent)) !== null) {
      const [, name, argsStr] = match;
      
      const slot = {
        name,
        parameters: argsStr ? this.parseSlotArgs(argsStr) : [],
        description: `${name}插槽`
      };
      
      slots.push(slot);
    }
    
    return slots;
  }
  
  async parseDemoFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // 简单提取示例信息
    const example = {
      title: this.formatExampleTitle(fileName),
      description: '',
      scenario: this.inferScenario(fileName),
      code: this.extractCodeFromDemo(content),
      framework: 'vue3',
      complexity: this.inferComplexity(content)
    };
    
    return example;
  }
  
  // 工具方法
  getTypeText(typeNode) {
    if (!typeNode) return 'any';
    
    const typeChecker = null; // 简化版本，无需类型检查器
    
    switch (typeNode.kind) {
      case ts.SyntaxKind.StringKeyword:
        return 'string';
      case ts.SyntaxKind.NumberKeyword:
        return 'number';
      case ts.SyntaxKind.BooleanKeyword:
        return 'boolean';
      case ts.SyntaxKind.UnionType:
        return typeNode.types.map(t => this.getTypeText(t)).join(' | ');
      case ts.SyntaxKind.LiteralType:
        if (ts.isStringLiteral(typeNode.literal)) {
          return `"${typeNode.literal.text}"`;
        }
        return typeNode.literal.text;
      default:
        return 'any';
    }
  }
  
  getJSDocComment(node) {
    const jsDoc = ts.getJSDocCommentsAndTags(node)[0];
    if (jsDoc && ts.isJSDoc(jsDoc) && jsDoc.comment) {
      return typeof jsDoc.comment === 'string' ? jsDoc.comment : jsDoc.comment.map(c => c.text).join('');
    }
    return '';
  }
  
  extractEnumOptions(typeNode) {
    if (!typeNode || typeNode.kind !== ts.SyntaxKind.UnionType) {
      return [];
    }
    
    return typeNode.types
      .filter(t => t.kind === ts.SyntaxKind.LiteralType)
      .map(t => ts.isStringLiteral(t.literal) ? t.literal.text : t.literal.text);
  }
  
  parseEventParameters(typeNode) {
    // 简化的事件参数解析
    if (typeNode && typeNode.kind === ts.SyntaxKind.TupleType) {
      return typeNode.elements.map((element, index) => ({
        name: `arg${index}`,
        type: this.getTypeText(element),
        description: ''
      }));
    }
    return [];
  }
  
  parseMethodParameters(parameters) {
    return parameters.map(param => ({
      name: param.name.text,
      type: this.getTypeText(param.type),
      optional: !!param.questionToken,
      description: this.getJSDocComment(param)
    }));
  }
  
  parseSlotArgs(argsStr) {
    // 简化的插槽参数解析
    try {
      const args = argsStr.split(',').map(arg => arg.trim());
      return args.map((arg, index) => ({
        name: arg || `arg${index}`,
        type: 'any',
        description: ''
      }));
    } catch {
      return [];
    }
  }
  
  formatExampleTitle(fileName) {
    return fileName
      .replace(/[-_]/g, ' ')
      .replace(/\\b\\w/g, l => l.toUpperCase());
  }
  
  inferScenario(fileName) {
    const scenarioMap = {
      'basic': '基础用法',
      'advanced': '高级用法',
      'form': '表单使用',
      'validation': '表单验证',
      'async': '异步操作',
      'custom': '自定义样式',
      'event': '事件处理'
    };
    
    for (const [key, value] of Object.entries(scenarioMap)) {
      if (fileName.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    return '基础用法';
  }
  
  extractCodeFromDemo(content) {
    // 简化的代码提取
    if (content.includes('<template>')) {
      // Vue 单文件组件
      return content;
    } else {
      // 其他格式，直接返回
      return content;
    }
  }
  
  inferComplexity(content) {
    const lines = content.split('\\n').length;
    if (lines > 100) return 'advanced';
    if (lines > 50) return 'intermediate';
    return 'basic';
  }
  
  toPascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  async directoryExists(dirPath) {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
  
  async generateAPIData() {
    console.log('📝 生成API数据文件...');
    
    // 读取package.json获取版本信息
    let version = '1.0.0';
    try {
      const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
      version = packageJson.version || version;
    } catch {
      // 忽略错误，使用默认版本
    }
    
    const apiData = {
      version,
      generatedAt: new Date().toISOString(),
      packageInfo: {
        vue3: '@king-design/vue',
        vue2: '@king-design/vue-legacy',
        react: '@king-design/react'
      },
      components: Object.fromEntries(this.components),
      globalTypes: Object.fromEntries(this.globalTypes)
    };
    
    // 生成完整的API数据文件
    const fullDataPath = path.join(this.outputDir, 'kpc-api-full.json');
    await fs.writeFile(fullDataPath, JSON.stringify(apiData, null, 2));
    
    // 生成压缩版本（生产环境使用）
    const compactDataPath = path.join(this.outputDir, 'kpc-api-compact.json');
    await fs.writeFile(compactDataPath, JSON.stringify(apiData));
    
    // 生成组件索引文件（快速查找）
    const indexData = {
      version,
      generatedAt: apiData.generatedAt,
      components: Array.from(this.components.values()).map(comp => ({
        name: comp.name,
        description: comp.description,
        category: comp.category,
        tags: comp.tags
      }))
    };
    
    const indexPath = path.join(this.outputDir, 'kpc-api-index.json');
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
    
    // 按分类生成单独的文件
    const categories = new Map();
    for (const component of this.components.values()) {
      if (!categories.has(component.category)) {
        categories.set(component.category, []);
      }
      categories.get(component.category).push(component);
    }
    
    for (const [category, components] of categories) {
      const categoryData = {
        category,
        components: Object.fromEntries(components.map(c => [c.name, c]))
      };
      
      const categoryPath = path.join(this.outputDir, `kpc-api-${category}.json`);
      await fs.writeFile(categoryPath, JSON.stringify(categoryData, null, 2));
    }
    
    console.log(`✅ 生成了以下文件:`);
    console.log(`  - kpc-api-full.json (完整数据)`);
    console.log(`  - kpc-api-compact.json (压缩数据)`);
    console.log(`  - kpc-api-index.json (组件索引)`);
    console.log(`  - kpc-api-*.json (分类数据)`);
  }
}

// 主程序
async function main() {
  const extractor = new KPCAPIExtractor();
  await extractor.extract();
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = KPCAPIExtractor;