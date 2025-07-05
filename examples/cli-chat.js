#!/usr/bin/env node
/**
 * KPC智能助手命令行聊天工具
 */
import readline from 'readline';
import { KPCOllamaAssistant } from '../src/ollama-assistant.js';
class KPCChatCLI {
    assistant;
    rl;
    constructor() {
        this.assistant = new KPCOllamaAssistant();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '🤖 KPC助手> '
        });
    }
    async start() {
        console.log('🚀 KPC智能助手启动中...');
        try {
            await this.assistant.initialize();
            console.log('✅ 助手初始化完成！');
            console.log('💡 您可以问我关于KPC组件的任何问题');
            console.log('💡 输入 "exit" 或 "quit" 退出\n');
            this.showPrompt();
            this.setupEventHandlers();
        }
        catch (error) {
            console.error('❌ 初始化失败:', error);
            process.exit(1);
        }
    }
    showPrompt() {
        this.rl.prompt();
    }
    setupEventHandlers() {
        this.rl.on('line', async (input) => {
            const question = input.trim();
            if (!question) {
                this.showPrompt();
                return;
            }
            if (question.toLowerCase() === 'exit' || question.toLowerCase() === 'quit') {
                console.log('👋 再见！');
                this.rl.close();
                return;
            }
            if (question.toLowerCase() === 'help') {
                this.showHelp();
                this.showPrompt();
                return;
            }
            console.log('🤔 思考中...');
            try {
                const answer = await this.assistant.chat(question);
                console.log('\n💡 回答:');
                console.log(answer);
                console.log();
            }
            catch (error) {
                console.log(`❌ 回答失败: ${error}\n`);
            }
            this.showPrompt();
        });
        this.rl.on('close', () => {
            console.log('\n👋 感谢使用KPC智能助手！');
            process.exit(0);
        });
        // 处理Ctrl+C
        this.rl.on('SIGINT', () => {
            console.log('\n👋 再见！');
            this.rl.close();
        });
    }
    showHelp() {
        console.log(`
📚 KPC智能助手使用帮助:

🔍 问题示例:
  • "Button组件有哪些属性？"
  • "如何使用Form组件？"
  • "搜索表单相关组件"
  • "Table组件的分页怎么实现？"
  • "验证这个配置：{type: 'primary'}"

⌨️  命令:
  • help - 显示帮助
  • exit/quit - 退出程序
  • Ctrl+C - 强制退出
`);
    }
}
// 启动CLI
const cli = new KPCChatCLI();
cli.start().catch(console.error);
//# sourceMappingURL=cli-chat.js.map