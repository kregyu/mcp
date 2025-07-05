#!/usr/bin/env node
/**
 * KPC MCP服务器测试套件
 * 验证所有功能是否正常工作
 */
import { KPCDataLoader } from './data-loader.js';
import { KPCUsageValidator } from './validators.js';
import { KPCExampleGenerator } from './example-generator.js';
import { KPCFormatter } from './formatters.js';
class KPCMCPTester {
    dataLoader;
    validator;
    exampleGenerator;
    formatter;
    testResults = [];
    constructor() {
        this.dataLoader = KPCDataLoader.getInstance();
        this.validator = new KPCUsageValidator();
        this.exampleGenerator = new KPCExampleGenerator();
        this.formatter = new KPCFormatter();
    }
    async runAllTests() {
        console.log('🧪 开始测试KPC MCP服务...\n');
        try {
            // 初始化数据加载器
            await this.dataLoader.initialize();
            // 运行所有测试
            await this.testDataLoader();
            await this.testComponentRetrieval();
            await this.testSearch();
            await this.testValidation();
            await this.testExampleGeneration();
            await this.testFormatting();
            // 输出测试结果
            this.printResults();
        }
        catch (error) {
            console.error('❌ 测试过程出错:', error);
            process.exit(1);
        }
    }
    async testDataLoader() {
        console.log('📊 测试数据加载器...');
        // 测试基础数据加载
        await this.runTest('数据加载器初始化', async () => {
            const componentCount = this.dataLoader.getComponentCount();
            return componentCount > 0;
        });
        await this.runTest('获取版本信息', async () => {
            const version = this.dataLoader.getVersion();
            return typeof version === 'string' && version.length > 0;
        });
        await this.runTest('获取统计信息', async () => {
            const stats = this.dataLoader.getStats();
            return stats.totalComponents > 0 && Object.keys(stats.categories).length > 0;
        });
        await this.runTest('获取分类列表', async () => {
            const categories = this.dataLoader.getAvailableCategories();
            return categories.length > 0 && categories.includes('表单组件');
        });
    }
    async testComponentRetrieval() {
        console.log('🔍 测试组件获取功能...');
        // 测试获取存在的组件
        await this.runTest('获取Spinner组件', async () => {
            const component = this.dataLoader.getComponent('Spinner');
            return component !== null && component.name === 'Spinner';
        });
        await this.runTest('获取Form组件', async () => {
            const component = this.dataLoader.getComponent('Form');
            return component !== null && component.category === '表单组件';
        });
        // 测试获取不存在的组件
        await this.runTest('获取不存在的组件', async () => {
            const component = this.dataLoader.getComponent('NonExistentComponent');
            return component === null;
        });
        // 测试获取所有组件
        await this.runTest('获取所有组件列表', async () => {
            const components = this.dataLoader.getAllComponents();
            return components.length > 50; // 应该有50+个组件
        });
        // 测试按分类获取组件
        await this.runTest('按分类获取表单组件', async () => {
            const components = this.dataLoader.getComponentsByCategory('表单组件');
            return components.length > 10 && components.some(c => c.name === 'Form');
        });
    }
    async testSearch() {
        console.log('🔎 测试搜索功能...');
        // 测试精确搜索
        await this.runTest('搜索"数字"找到Spinner', async () => {
            const results = this.dataLoader.searchComponents('数字');
            return results.length > 0 && results.some(r => r.name === 'Spinner');
        });
        await this.runTest('搜索"表单"找到Form', async () => {
            const results = this.dataLoader.searchComponents('表单');
            return results.length > 0 && results.some(r => r.name === 'Form');
        });
        await this.runTest('搜索"按钮"找到Button', async () => {
            const results = this.dataLoader.searchComponents('按钮');
            return results.length > 0 && results.some(r => r.name === 'Button');
        });
        // 测试模糊搜索
        await this.runTest('模糊搜索功能', async () => {
            const results = this.dataLoader.searchComponents('input', { fuzzy: true });
            return results.length > 0;
        });
        // 测试分类筛选搜索
        await this.runTest('分类筛选搜索', async () => {
            const results = this.dataLoader.searchComponents('组件', { category: '表单组件' });
            return results.length > 0 && results.every(r => r.category === '表单组件');
        });
        // 测试无结果搜索
        await this.runTest('无结果搜索', async () => {
            const results = this.dataLoader.searchComponents('xyz123impossiblequery');
            return results.length === 0;
        });
    }
    async testValidation() {
        console.log('✅ 测试验证功能...');
        const spinnerComponent = this.dataLoader.getComponent('Spinner');
        if (!spinnerComponent) {
            this.addResult('获取Spinner组件用于验证', false, 'Spinner组件不存在');
            return;
        }
        // 测试正确的属性使用
        await this.runTest('验证正确的Spinner使用', async () => {
            const result = this.validator.validate(spinnerComponent, {
                value: 10,
                min: 0,
                max: 100
            });
            return result.isValid;
        });
        // 测试错误的属性使用
        await this.runTest('验证错误的属性使用', async () => {
            const result = this.validator.validate(spinnerComponent, {
                nonExistentProp: 'test'
            });
            return !result.isValid && result.errors.length > 0;
        });
        // 测试嵌套验证
        const inputComponent = this.dataLoader.getComponent('Input');
        if (inputComponent) {
            await this.runTest('验证Form嵌套规则', async () => {
                const result = this.validator.validate(inputComponent, {}, 'Form');
                return !result.isValid; // Input不应该直接在Form中
            });
        }
        // 测试FormItem特殊规则
        const formItemComponent = this.dataLoader.getComponent('FormItem');
        if (formItemComponent) {
            await this.runTest('验证FormItem缺少value属性', async () => {
                const result = this.validator.validate(formItemComponent, {}, 'Form');
                return !result.isValid;
            });
        }
    }
    async testExampleGeneration() {
        console.log('📝 测试示例生成功能...');
        const buttonComponent = this.dataLoader.getComponent('Button');
        if (!buttonComponent) {
            this.addResult('获取Button组件用于示例生成', false, 'Button组件不存在');
            return;
        }
        // 测试基础示例生成
        await this.runTest('生成基础示例', async () => {
            const example = this.exampleGenerator.generateBasicExample(buttonComponent);
            return example.title === '基础用法' && example.code.includes('<Button');
        });
        // 测试高级示例生成
        await this.runTest('生成高级示例', async () => {
            const example = this.exampleGenerator.generateAdvancedExample(buttonComponent);
            return example.title === '高级配置' && example.complexity === 'advanced';
        });
        // 测试表单示例生成
        const inputComponent = this.dataLoader.getComponent('Input');
        if (inputComponent) {
            await this.runTest('生成表单示例', async () => {
                const example = this.exampleGenerator.generateFormExample(inputComponent);
                return example !== null && example.code.includes('<Form');
            });
        }
        // 测试按场景生成示例
        await this.runTest('按场景生成示例', async () => {
            const example = this.exampleGenerator.generateExampleByScenario(buttonComponent, '事件处理');
            return example !== null && example.scenario === '事件处理';
        });
    }
    async testFormatting() {
        console.log('📄 测试格式化功能...');
        const tableComponent = this.dataLoader.getComponent('Table');
        if (!tableComponent) {
            this.addResult('获取Table组件用于格式化测试', false, 'Table组件不存在');
            return;
        }
        // 测试完整API格式化
        await this.runTest('格式化完整API文档', async () => {
            const formatted = this.formatter.formatComponentAPI(tableComponent);
            return formatted.includes('# Table 组件API') &&
                formatted.includes('## Props 属性') &&
                formatted.includes('## 导入方式');
        });
        // 测试组件列表格式化
        await this.runTest('格式化组件列表', async () => {
            const components = this.dataLoader.getAllComponents().slice(0, 5);
            const formatted = this.formatter.formatComponentList(components, '测试列表');
            return formatted.includes('# 测试列表') && formatted.includes('##');
        });
        // 测试搜索结果格式化
        await this.runTest('格式化搜索结果', async () => {
            const results = [{ name: 'Button', description: '按钮组件', category: '基础组件', tags: ['按钮'] }];
            const formatted = this.formatter.formatSearchResults(results, '按钮');
            return formatted.includes('找到 1 个与 "按钮" 相关的组件');
        });
        // 测试验证结果格式化
        await this.runTest('格式化验证结果', async () => {
            const validResult = { isValid: true, errors: [], suggestions: [] };
            const invalidResult = {
                isValid: false,
                errors: [{ type: 'unknown-prop', message: '测试错误' }],
                suggestions: ['测试建议']
            };
            const validFormatted = this.formatter.formatValidationResult(validResult);
            const invalidFormatted = this.formatter.formatValidationResult(invalidResult);
            return validFormatted.includes('✅') && invalidFormatted.includes('❌');
        });
        // 测试统计信息格式化
        await this.runTest('格式化统计信息', async () => {
            const stats = this.dataLoader.getStats();
            const formatted = this.formatter.formatStats(stats);
            return formatted.includes('# KPC组件库统计信息') && formatted.includes('组件总数');
        });
    }
    async runTest(name, testFn) {
        const startTime = Date.now();
        try {
            const success = await testFn();
            const duration = Date.now() - startTime;
            this.addResult(name, success, undefined, duration);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.addResult(name, false, String(error), duration);
        }
    }
    addResult(name, success, details, duration) {
        this.testResults.push({ name, success, details, duration });
        const icon = success ? '✅' : '❌';
        const durationText = duration !== undefined ? ` (${duration}ms)` : '';
        const detailsText = details ? ` - ${details}` : '';
        console.log(`  ${icon} ${name}${durationText}${detailsText}`);
    }
    printResults() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const totalDuration = this.testResults.reduce((sum, r) => sum + (r.duration || 0), 0);
        console.log(`\n📊 测试结果:`);
        console.log(`   总计: ${totalTests} 个测试`);
        console.log(`   通过: ${passedTests} 个`);
        console.log(`   失败: ${failedTests} 个`);
        console.log(`   成功率: ${Math.round((passedTests / totalTests) * 100)}%`);
        console.log(`   总耗时: ${totalDuration}ms`);
        if (failedTests > 0) {
            console.log(`\n❌ 失败的测试:`);
            this.testResults
                .filter(r => !r.success)
                .forEach(r => console.log(`   - ${r.name}: ${r.details}`));
        }
        console.log(failedTests === 0 ? '\n🎉 所有测试通过！' : '\n⚠️  部分测试失败');
        if (failedTests > 0) {
            process.exit(1);
        }
    }
}
// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new KPCMCPTester();
    tester.runAllTests().catch(console.error);
}
//# sourceMappingURL=test.js.map