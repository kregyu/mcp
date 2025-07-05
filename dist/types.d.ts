/**
 * KPC组件库API数据类型定义
 */
export interface ComponentAPI {
    name: string;
    description: string;
    category: string;
    tags: string[];
    filePath: string;
    props: PropDefinition[];
    events: EventDefinition[];
    methods: MethodDefinition[];
    slots: SlotDefinition[];
    examples: UsageExample[];
    nestingRules: NestingRule[];
    dependencies: string[];
}
export interface PropDefinition {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
    description: string;
    options: string[];
    deprecated?: boolean;
    version?: string;
}
export interface EventDefinition {
    name: string;
    parameters: EventParameter[];
    description: string;
    deprecated?: boolean;
}
export interface EventParameter {
    name: string;
    type: string;
    description: string;
}
export interface MethodDefinition {
    name: string;
    parameters: MethodParameter[];
    returnType: string;
    description: string;
    access: 'public' | 'protected' | 'private';
}
export interface MethodParameter {
    name: string;
    type: string;
    optional: boolean;
    description: string;
}
export interface SlotDefinition {
    name: string;
    parameters: SlotParameter[];
    description: string;
    default?: string;
}
export interface SlotParameter {
    name: string;
    type: string;
    description: string;
}
export interface UsageExample {
    title: string;
    description?: string;
    scenario?: string;
    code: string;
    framework: 'vue2' | 'vue3' | 'react' | 'angular';
    complexity: 'basic' | 'intermediate' | 'advanced';
}
export interface NestingRule {
    parent: string;
    children: {
        required: string[];
        allowed: string[];
        forbidden: string[];
    };
    mandatory: boolean;
    description: string;
}
export interface PackageInfo {
    vue3: string;
    vue2: string;
    react: string;
}
export interface KPCAPIData {
    version: string;
    generatedAt: string;
    packageInfo: PackageInfo;
    components: Record<string, ComponentAPI>;
    globalTypes: Record<string, any>;
}
export interface ComponentIndex {
    version: string;
    generatedAt: string;
    components: ComponentSummary[];
}
export interface ComponentSummary {
    name: string;
    description: string;
    category: string;
    tags: string[];
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    suggestions: string[];
}
export interface ValidationError {
    type: 'missing-required-prop' | 'unknown-prop' | 'invalid-prop-type' | 'invalid-nesting';
    message: string;
    property?: string;
}
export interface SearchOptions {
    category?: string;
    tags?: string[];
    fuzzy?: boolean;
}
export interface ComponentFilter {
    category?: string;
    hasProps?: string[];
    hasEvents?: string[];
    hasMethods?: string[];
    complexity?: 'basic' | 'intermediate' | 'advanced';
}
//# sourceMappingURL=types.d.ts.map