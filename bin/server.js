#!/usr/bin/env node

import { KPCMCPServer } from '../dist/index.js';

// 启动服务器
const server = new KPCMCPServer();
server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});