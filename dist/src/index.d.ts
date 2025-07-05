#!/usr/bin/env node
/**
 * KPC组件库MCP服务器
 * 基于官方 @modelcontextprotocol/sdk 实现
 */
declare class KPCMCPServer {
    private server;
    private dataLoader;
    private validator;
    private exampleGenerator;
    private formatter;
    constructor();
    private setupToolHandlers;
    private handleGetComponent;
    private handleSearchComponents;
    private handleListComponents;
    private handleValidateUsage;
    private handleGetUsageExamples;
    private handleGetStats;
    private setupErrorHandling;
    start(): Promise<void>;
}
export { KPCMCPServer };
//# sourceMappingURL=index.d.ts.map