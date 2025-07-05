/**
 * Ollama + KPC智能助手使用示例
 */
import { KPCOllamaAssistant } from '../src/ollama-assistant.js';

async function main() {
    console.log('🚀 启动KPC智能助手演示...\n');

    // 创建助手实例
    const assistant = new KPCOllamaAssistant(
        'http://localhost:11434',  // Ollama服务地址
        'qwen3:8b'               // 使用的模型
    );

    // 初始化
    await assistant.initialize();

    // 测试问题列表
    const questions = [
        'Button组件有哪些属性？',
        '如何使用Form组件进行表单验证？',
        '搜索所有表单相关的组件',
        'Table组件如何实现分页？',
        '验证这个Button配置是否正确：{type: "primary", size: "large"}',
        'KPC组件库总共有多少个组件？'
    ];

    console.log('📝 开始问答测试:\n');

    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        console.log(`❓ 问题 ${i + 1}: ${question}`);
        console.log('🤔 思考中...\n');

        try {
            const answer = await assistant.chat(question);
            console.log(`💡 回答:`);
            console.log(answer);
        } catch (error) {
            console.log(`❌ 回答失败: ${error}`);
        }

        console.log('\n' + '='.repeat(80) + '\n');

        // 间隔一下，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ 演示完成！');
}

// 运行演示
main().catch(console.error);