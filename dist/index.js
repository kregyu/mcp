#!/usr/bin/env node
/**
 * KPC组件库MCP服务器
 * 基于官方 @modelcontextprotocol/sdk 实现
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { KPCDataLoader } from './data-loader.js';
import { KPCUsageValidator } from './validators.js';
import { KPCExampleGenerator } from './example-generator.js';
import { KPCFormatter } from './formatters.js';
class KPCMCPServer {
    server;
    dataLoader;
    validator;
    exampleGenerator;
    formatter;
    constructor() {
        this.server = new Server({
            name: 'kpc-components',
            version: '1.0.0',
            description: 'KPC组件库API查询和验证服务',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.dataLoader = KPCDataLoader.getInstance();
        this.validator = new KPCUsageValidator();
        this.exampleGenerator = new KPCExampleGenerator();
        this.formatter = new KPCFormatter();
        this.setupToolHandlers();
        this.setupErrorHandling();
    }
    setupToolHandlers() {
        // 注册工具列表处理器
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'get_kpc_component',
                        description: '获取KPC组件的完整API定义，包括props、events、methods、slots和使用示例',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                component: {
                                    type: 'string',
                                    description: '组件名称，如 Form、Input、Button、Spinner、Table等',
                                },
                            },
                            required: ['component'],
                        },
                    },
                    {
                        name: 'search_kpc_components',
                        description: '根据关键词搜索相关的KPC组件',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: '搜索关键词，支持中文描述，如"表单"、"输入"、"数字"、"表格"等',
                                },
                                category: {
                                    type: 'string',
                                    description: '可选：按分类筛选，如"表单组件"、"数据展示"等',
                                },
                                fuzzy: {
                                    type: 'boolean',
                                    description: '可选：是否启用模糊搜索，默认false',
                                },
                            },
                            required: ['query'],
                        },
                    },
                    {
                        name: 'list_kpc_components',
                        description: '列出所有可用的KPC组件或按分类筛选',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                category: {
                                    type: 'string',
                                    description: '可选：组件分类筛选，如"基础组件"、"表单组件"、"数据展示"等',
                                },
                                summary: {
                                    type: 'boolean',
                                    description: '可选：是否只返回摘要信息，默认false',
                                },
                            },
                        },
                    },
                    {
                        name: 'validate_kpc_usage',
                        description: '验证KPC组件的使用是否正确，检查属性、嵌套关系等',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                component: {
                                    type: 'string',
                                    description: '组件名称',
                                },
                                props: {
                                    type: 'object',
                                    description: '组件属性对象',
                                },
                                context: {
                                    type: 'string',
                                    description: '上下文信息，如父组件名称',
                                },
                            },
                            required: ['component', 'props'],
                        },
                    },
                    {
                        name: 'get_kpc_usage_examples',
                        description: '获取KPC组件的使用示例代码',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                component: {
                                    type: 'string',
                                    description: '组件名称',
                                },
                                scenario: {
                                    type: 'string',
                                    description: '使用场景，如"基础用法"、"表单验证"、"高级配置"、"事件处理"等',
                                },
                                framework: {
                                    type: 'string',
                                    description: '可选：目标框架，默认vue3',
                                    enum: ['vue2', 'vue3', 'react'],
                                },
                            },
                            required: ['component'],
                        },
                    },
                    {
                        name: 'get_kpc_stats',
                        description: '获取KPC组件库的统计信息',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    },
                ],
            };
        });
        // 注册工具调用处理器
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'get_kpc_component':
                        return await this.handleGetComponent(args?.component);
                    case 'search_kpc_components':
                        return await this.handleSearchComponents(args?.query, args?.category, args?.fuzzy);
                    case 'list_kpc_components':
                        return await this.handleListComponents(args?.category, args?.summary);
                    case 'validate_kpc_usage':
                        return await this.handleValidateUsage(args?.component, args?.props, args?.context);
                    case 'get_kpc_usage_examples':
                        return await this.handleGetUsageExamples(args?.component, args?.scenario, args?.framework);
                    case 'get_kpc_stats':
                        return await this.handleGetStats();
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
            }
        });
    }
    async handleGetComponent(componentName) {
        if (!componentName) {
            throw new McpError(ErrorCode.InvalidParams, 'Component name is required');
        }
        const component = this.dataLoader.getComponent(componentName);
        if (!component) {
            const availableComponents = this.dataLoader.getAllComponents()
                .map(c => c.name)
                .sort()
                .slice(0, 10)
                .join(', ');
            return {
                content: [
                    {
                        type: 'text',
                        text: `组件 "${componentName}" 不存在。

可用组件示例: ${availableComponents}...

使用 \`search_kpc_components\` 或 \`list_kpc_components\` 查看完整列表。`,
                    },
                ],
            };
        }
        const formattedAPI = this.formatter.formatComponentAPI(component);
        return {
            content: [
                {
                    type: 'text',
                    text: formattedAPI,
                },
            ],
        };
    }
    async handleSearchComponents(query, category, fuzzy = false) {
        if (!query?.trim()) {
            throw new McpError(ErrorCode.InvalidParams, 'Search query is required');
        }
        const results = this.dataLoader.searchComponents(query, { category, fuzzy });
        const formattedResults = this.formatter.formatSearchResults(results, query);
        return {
            content: [
                {
                    type: 'text',
                    text: formattedResults,
                },
            ],
        };
    }
    async handleListComponents(category, summary = false) {
        let components;
        let title = '所有组件';
        if (category) {
            components = this.dataLoader.getComponentsByCategory(category);
            title = category;
            if (components.length === 0) {
                const availableCategories = this.dataLoader.getAvailableCategories().join('", "');
                return {
                    content: [
                        {
                            type: 'text',
                            text: `分类 "${category}" 不存在或没有组件。

可用分类: "${availableCategories}"`,
                        },
                    ],
                };
            }
        }
        else {
            components = this.dataLoader.getAllComponents();
        }
        const formattedList = this.formatter.formatComponentList(components, title);
        return {
            content: [
                {
                    type: 'text',
                    text: formattedList,
                },
            ],
        };
    }
    async handleValidateUsage(componentName, props, context) {
        if (!componentName || !props) {
            throw new McpError(ErrorCode.InvalidParams, 'Component name and props are required');
        }
        const component = this.dataLoader.getComponent(componentName);
        if (!component) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `组件 "${componentName}" 不存在，无法验证使用方式。`,
                    },
                ],
            };
        }
        const validationResult = this.validator.validate(component, props, context);
        const formattedResult = this.formatter.formatValidationResult(validationResult);
        return {
            content: [
                {
                    type: 'text',
                    text: formattedResult,
                },
            ],
        };
    }
    async handleGetUsageExamples(componentName, scenario, framework = 'vue3') {
        if (!componentName) {
            throw new McpError(ErrorCode.InvalidParams, 'Component name is required');
        }
        const component = this.dataLoader.getComponent(componentName);
        if (!component) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `组件 "${componentName}" 不存在，无法生成示例。`,
                    },
                ],
            };
        }
        // 使用现有示例或生成新示例
        let examples = component.examples;
        if (scenario) {
            // 按场景筛选
            examples = examples.filter(ex => ex.scenario?.toLowerCase().includes(scenario.toLowerCase()) ||
                ex.title.toLowerCase().includes(scenario.toLowerCase()));
            // 如果没有找到匹配的示例，生成一个
            if (examples.length === 0) {
                const generatedExample = this.exampleGenerator.generateExampleByScenario(component, scenario);
                if (generatedExample) {
                    examples = [generatedExample];
                }
            }
        }
        // 如果还是没有示例，生成基础示例
        if (examples.length === 0) {
            const basicExample = this.exampleGenerator.generateBasicExample(component);
            examples = [basicExample];
        }
        const formattedExamples = this.formatter.formatExamples(examples);
        const content = `# ${componentName} 组件使用示例\n\n${formattedExamples}`;
        return {
            content: [
                {
                    type: 'text',
                    text: content,
                },
            ],
        };
    }
    async handleGetStats() {
        const stats = this.dataLoader.getStats();
        const formattedStats = this.formatter.formatStats(stats);
        return {
            content: [
                {
                    type: 'text',
                    text: formattedStats,
                },
            ],
        };
    }
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    async start() {
        // 初始化数据加载器
        await this.dataLoader.initialize();
        console.error('🚀 KPC MCP服务器启动中...');
        console.error(`📦 已加载 ${this.dataLoader.getComponentCount()} 个组件`);
        console.error(`📅 数据版本: ${this.dataLoader.getVersion()}`);
        console.error(`🕒 生成时间: ${this.dataLoader.getGeneratedAt()}`);
        // 使用stdio传输
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('✅ KPC MCP服务器已启动，等待请求...');
    }
}
// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new KPCMCPServer();
    server.start().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}
export { KPCMCPServer };
//# sourceMappingURL=index.js.map