#!/usr/bin/env node
/**
 * 测试 get_kpc_usage_examples 工具调用
 */
import { KPCMCPServer } from '../src/index.js';
async function testGetUsageExamples() {
    console.log('🔧 测试 get_kpc_usage_examples 工具调用...\n');
    const server = new KPCMCPServer();
    // 需要先初始化数据加载器
    await server.dataLoader.initialize();
    // 模拟工具调用请求
    const testCases = [
        {
            name: '基础用法测试',
            args: {
                component: 'Button'
            }
        },
        {
            name: '指定场景测试',
            args: {
                component: 'Form',
                scenario: '表单验证'
            }
        },
        {
            name: '指定框架测试',
            args: {
                component: 'Table',
                scenario: '分页',
                framework: 'vue3'
            }
        },
        {
            name: '不存在的组件测试',
            args: {
                component: 'NonExistentComponent'
            }
        }
    ];
    for (const testCase of testCases) {
        console.log(`📋 测试案例: ${testCase.name}`);
        console.log(`🔧 参数: ${JSON.stringify(testCase.args)}`);
        try {
            // 直接调用处理方法
            const result = await server['handleGetUsageExamples'](testCase.args.component, testCase.args.scenario, testCase.args.framework);
            console.log('✅ 成功获取示例');
            console.log(`📝 内容长度: ${result.content[0].text.length} 字符`);
            console.log(`📄 内容预览:\n${result.content[0].text.substring(0, 200)}...\n`);
        }
        catch (error) {
            console.log(`❌ 失败: ${error}\n`);
        }
        console.log('---\n');
    }
}
async function main() {
    try {
        await testGetUsageExamples();
    }
    catch (error) {
        console.error('测试失败:', error);
    }
}
main().catch(console.error);
//# sourceMappingURL=test-examples.js.map