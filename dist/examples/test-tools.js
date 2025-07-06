/**
 * 测试工具调用功能（无需Ollama）
 */
import { KPCOllamaAssistant } from '../src/ollama-assistant.js';
async function testToolDetection() {
    console.log('🔧 测试工具检测功能...\n');
    const assistant = new KPCOllamaAssistant();
    await assistant.initialize();
    const testCases = [
        'Button组件有哪些属性？',
        '如何使用Form组件？',
        '搜索表单相关的组件',
        'Table组件如何实现分页？',
        '验证这个Button配置是否正确：{type: "primary", size: "large"}',
        'KPC组件库总共有多少个组件？',
        '你好，今天天气怎么样？' // 不相关问题
    ];
    for (const question of testCases) {
        console.log(`❓ 问题: ${question}`);
        // 测试工具检测
        const toolAction = assistant['detectToolNeeded'](question);
        if (toolAction) {
            console.log(`🔧 检测到工具: ${toolAction.name}`);
            console.log(`📝 参数: ${JSON.stringify(toolAction.arguments)}`);
            // 执行工具
            try {
                const result = await assistant['executeTool'](toolAction);
                console.log(`✅ 工具执行成功，数据长度: ${result.length} 字符`);
            }
            catch (error) {
                console.log(`❌ 工具执行失败: ${error}`);
            }
        }
        else {
            console.log(`💭 无需工具，直接回答`);
        }
        console.log('---\n');
    }
}
testToolDetection().catch(console.error);
//# sourceMappingURL=test-tools.js.map