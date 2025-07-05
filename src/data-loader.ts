/**
 * KPC API数据加载器
 * 负责加载和缓存组件API数据
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { 
  KPCAPIData, 
  ComponentIndex, 
  ComponentAPI, 
  ComponentSummary 
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class KPCDataLoader {
  private static instance: KPCDataLoader;
  private apiData: KPCAPIData | null = null;
  private indexData: ComponentIndex | null = null;
  private categoryData: Map<string, { category: string; components: Record<string, ComponentAPI> }> = new Map();
  private initialized = false;
  private dataDir: string;

  private constructor(dataDir = '../data') {
    this.dataDir = join(__dirname, dataDir);
  }

  static getInstance(dataDir?: string): KPCDataLoader {
    if (!KPCDataLoader.instance) {
      KPCDataLoader.instance = new KPCDataLoader(dataDir);
    }
    return KPCDataLoader.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔄 正在加载KPC组件API数据...');

      // 加载组件索引数据
      const indexPath = join(this.dataDir, 'kpc-api-index.json');
      const indexContent = await readFile(indexPath, 'utf-8');
      this.indexData = JSON.parse(indexContent);

      // 加载完整组件数据
      const fullDataPath = join(this.dataDir, 'kpc-api-full.json');
      const fullContent = await readFile(fullDataPath, 'utf-8');
      this.apiData = JSON.parse(fullContent);

      // 加载分类数据
      const categories = ['基础组件', '表单组件', '数据展示', '导航组件', '布局组件', '反馈组件', '工具组件'];
      
      for (const category of categories) {
        try {
          const categoryPath = join(this.dataDir, `kpc-api-${category}.json`);
          const categoryContent = await readFile(categoryPath, 'utf-8');
          const categoryData = JSON.parse(categoryContent);
          this.categoryData.set(category, categoryData);
        } catch (error) {
          console.warn(`⚠️  无法加载分类数据: ${category}`);
        }
      }

      console.log(`✅ 已加载 ${Object.keys(this.apiData!.components).length} 个组件`);
      this.initialized = true;

    } catch (error) {
      console.error('❌ 数据加载失败:', error);
      throw new Error(`Failed to load KPC API data: ${error}`);
    }
  }

  getApiData(): KPCAPIData {
    this.ensureInitialized();
    return this.apiData!;
  }

  getIndexData(): ComponentIndex {
    this.ensureInitialized();
    return this.indexData!;
  }

  getComponent(name: string): ComponentAPI | null {
    this.ensureInitialized();
    return this.apiData!.components[name] || null;
  }

  getAllComponents(): ComponentSummary[] {
    this.ensureInitialized();
    return this.indexData!.components;
  }

  getComponentsByCategory(category: string): ComponentAPI[] {
    this.ensureInitialized();
    const categoryData = this.categoryData.get(category);
    if (!categoryData) return [];
    
    return Object.values(categoryData.components);
  }

  searchComponents(query: string, options: { 
    category?: string; 
    fuzzy?: boolean 
  } = {}): ComponentSummary[] {
    this.ensureInitialized();
    
    const queryLower = query.toLowerCase();
    let components = this.indexData!.components;

    // 按分类筛选
    if (options.category) {
      components = components.filter(comp => comp.category === options.category);
    }

    // 文本搜索
    const matchedComponents = components.filter(comp => {
      const searchText = [
        comp.name.toLowerCase(),
        comp.description.toLowerCase(),
        comp.tags.join(' ').toLowerCase()
      ].join(' ');

      if (options.fuzzy) {
        // 模糊搜索 - 检查是否包含任何查询词
        return queryLower.split(' ').some(term => 
          term.length > 1 && searchText.includes(term)
        );
      } else {
        // 精确搜索
        return searchText.includes(queryLower);
      }
    });

    // 按相关度排序
    return matchedComponents.sort((a, b) => {
      const aRelevance = this.calculateRelevance(a, queryLower);
      const bRelevance = this.calculateRelevance(b, queryLower);
      return bRelevance - aRelevance;
    });
  }

  getAvailableCategories(): string[] {
    return Array.from(this.categoryData.keys());
  }

  getComponentCount(): number {
    this.ensureInitialized();
    return Object.keys(this.apiData!.components).length;
  }

  getVersion(): string {
    this.ensureInitialized();
    return this.apiData!.version;
  }

  getGeneratedAt(): string {
    this.ensureInitialized();
    return this.apiData!.generatedAt;
  }

  private calculateRelevance(component: ComponentSummary, query: string): number {
    let score = 0;

    // 组件名完全匹配
    if (component.name.toLowerCase() === query) score += 100;
    
    // 组件名包含查询
    if (component.name.toLowerCase().includes(query)) score += 50;
    
    // 描述包含查询
    if (component.description.toLowerCase().includes(query)) score += 30;
    
    // 标签匹配
    component.tags.forEach(tag => {
      if (tag.toLowerCase().includes(query)) score += 20;
      if (tag.toLowerCase() === query) score += 40;
    });

    return score;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('KPCDataLoader not initialized. Call initialize() first.');
    }
  }

  // 统计信息
  getStats(): {
    totalComponents: number;
    totalProps: number;
    totalEvents: number;
    totalMethods: number;
    totalExamples: number;
    categories: Record<string, number>;
  } {
    this.ensureInitialized();
    
    const components = Object.values(this.apiData!.components);
    const categories: Record<string, number> = {};

    let totalProps = 0;
    let totalEvents = 0;
    let totalMethods = 0;
    let totalExamples = 0;

    components.forEach(comp => {
      totalProps += comp.props.length;
      totalEvents += comp.events.length;
      totalMethods += comp.methods.length;
      totalExamples += comp.examples.length;
      
      categories[comp.category] = (categories[comp.category] || 0) + 1;
    });

    return {
      totalComponents: components.length,
      totalProps,
      totalEvents,
      totalMethods,
      totalExamples,
      categories
    };
  }
}