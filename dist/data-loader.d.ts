/**
 * KPC API数据加载器
 * 负责加载和缓存组件API数据
 */
import type { KPCAPIData, ComponentIndex, ComponentAPI, ComponentSummary } from './types.js';
export declare class KPCDataLoader {
    private static instance;
    private apiData;
    private indexData;
    private categoryData;
    private initialized;
    private dataDir;
    private constructor();
    static getInstance(dataDir?: string): KPCDataLoader;
    initialize(): Promise<void>;
    getApiData(): KPCAPIData;
    getIndexData(): ComponentIndex;
    getComponent(name: string): ComponentAPI | null;
    getAllComponents(): ComponentSummary[];
    getComponentsByCategory(category: string): ComponentAPI[];
    searchComponents(query: string, options?: {
        category?: string;
        fuzzy?: boolean;
    }): ComponentSummary[];
    getAvailableCategories(): string[];
    getComponentCount(): number;
    getVersion(): string;
    getGeneratedAt(): string;
    private calculateRelevance;
    private ensureInitialized;
    /**
     * 规范化examples数据格式
     * 将字符串数组转换为UsageExample对象数组
     */
    private normalizeExamplesData;
    getStats(): {
        totalComponents: number;
        totalProps: number;
        totalEvents: number;
        totalMethods: number;
        totalExamples: number;
        categories: Record<string, number>;
    };
}
//# sourceMappingURL=data-loader.d.ts.map