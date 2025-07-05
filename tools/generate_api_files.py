#!/usr/bin/env python3
"""
根据 kpc-api-full.json 生成其他 API 文件
包括 compact 版本和按分类的版本
"""

import json
import os
from typing import Dict, Any, List
from collections import defaultdict

def load_json_file(file_path: str) -> Dict[str, Any]:
    """加载JSON文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json_file(file_path: str, data: Dict[str, Any], compact: bool = False) -> None:
    """保存JSON文件"""
    with open(file_path, 'w', encoding='utf-8') as f:
        if compact:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        else:
            json.dump(data, f, ensure_ascii=False, indent=2)

def create_compact_component(component: Dict[str, Any]) -> Dict[str, Any]:
    """创建精简版组件数据"""
    compact_component = {
        "name": component["name"],
        "description": component["description"],
        "category": component["category"],
        "tags": component["tags"],
        "filePath": component["filePath"]
    }
    
    # 精简版只保留基本的 props 信息
    if component.get("props"):
        compact_component["props"] = []
        for prop in component["props"]:
            compact_prop = {
                "name": prop["name"],
                "type": prop["type"],
                "required": prop["required"]
            }
            compact_component["props"].append(compact_prop)
    
    # 精简版只保留事件名称
    if component.get("events"):
        compact_component["events"] = []
        for event in component["events"]:
            compact_event = {
                "name": event["name"]
            }
            compact_component["events"].append(compact_event)
    
    # 精简版只保留方法名称
    if component.get("methods"):
        compact_component["methods"] = []
        for method in component["methods"]:
            compact_method = {
                "name": method["name"],
                "access": method.get("access", "public")
            }
            compact_component["methods"].append(compact_method)
    
    return compact_component

def generate_compact_version(full_data: Dict[str, Any]) -> Dict[str, Any]:
    """生成精简版 API 文档"""
    compact_data = {
        "version": full_data["version"],
        "generatedAt": full_data["generatedAt"],
        "packageInfo": full_data["packageInfo"],
        "components": {}
    }
    
    for component_name, component_data in full_data["components"].items():
        compact_data["components"][component_name] = create_compact_component(component_data)
    
    return compact_data

def generate_category_files(full_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """按分类生成文件"""
    category_files = defaultdict(lambda: {
        "category": "",
        "components": {}
    })
    
    for component_name, component_data in full_data["components"].items():
        category = component_data.get("category", "其他")
        
        # 设置分类名称
        category_files[category]["category"] = category
        
        # 添加组件数据
        category_files[category]["components"][component_name] = component_data
    
    return dict(category_files)

def main():
    """主函数"""
    # 文件路径
    full_file_path = "data/kpc-api-full.json"
    
    # 检查文件是否存在
    if not os.path.exists(full_file_path):
        print(f"错误：文件 {full_file_path} 不存在")
        return
    
    # 加载完整数据
    print("正在加载完整 API 数据...")
    full_data = load_json_file(full_file_path)
    
    # 生成精简版
    print("正在生成精简版 API 文档...")
    compact_data = generate_compact_version(full_data)
    compact_file_path = "data/kpc-api-compact.json"
    save_json_file(compact_file_path, compact_data, compact=True)
    print(f"  精简版已保存至: {compact_file_path} (压缩格式)")
    
    # 生成按分类的文件
    print("正在生成按分类的 API 文档...")
    category_files = generate_category_files(full_data)
    
    category_stats = {}
    for category, category_data in category_files.items():
        file_path = f"data/kpc-api-{category}.json"
        save_json_file(file_path, category_data)
        
        component_count = len(category_data["components"])
        category_stats[category] = component_count
        print(f"  {category}: {component_count} 个组件 -> {file_path}")
    
    # 统计信息
    print("\n生成完成！")
    print(f"总组件数: {len(full_data['components'])}")
    print(f"生成文件数: {len(category_files) + 1}")  # +1 for compact version
    print("\n分类统计:")
    for category, count in sorted(category_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"  {category}: {count} 个组件")
    
    # 验证文件生成
    print("\n验证生成的文件:")
    for category in category_files.keys():
        file_path = f"data/kpc-api-{category}.json"
        if os.path.exists(file_path):
            print(f"  ✓ {file_path}")
        else:
            print(f"  ✗ {file_path} (生成失败)")
    
    if os.path.exists(compact_file_path):
        print(f"  ✓ {compact_file_path}")
    else:
        print(f"  ✗ {compact_file_path} (生成失败)")

if __name__ == "__main__":
    main()