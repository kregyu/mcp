#!/usr/bin/env python3
"""
补全 kpc-api-full.json 文件
将 config.json 中的完整信息合并到 kpc-api-full.json 中
"""

import json
import os
from typing import Dict, Any, List

def load_json_file(file_path: str) -> Dict[str, Any]:
    """加载JSON文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json_file(file_path: str, data: Dict[str, Any]) -> None:
    """保存JSON文件"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def convert_props_from_config(config_props: Dict[str, Any]) -> List[Dict[str, Any]]:
    """将config.json的props对象转换为kpc-api-full.json的props数组格式"""
    props = []
    for prop_name, prop_info in config_props.items():
        prop_data = {
            "name": prop_name,
            "type": prop_info.get("type", "any"),
            "required": prop_info.get("required", False),
            "description": prop_info.get("description", ""),
            "options": prop_info.get("options", [])
        }
        props.append(prop_data)
    return props

def convert_events_from_config(config_events: Dict[str, Any]) -> List[Dict[str, Any]]:
    """将config.json的events对象转换为kpc-api-full.json的events数组格式"""
    events = []
    for event_name, event_info in config_events.items():
        event_data = {
            "name": event_name,
            "parameters": [],
            "description": event_info.get("description", "")
        }
        events.append(event_data)
    return events

def convert_slots_from_config(config_slots: Dict[str, Any]) -> List[Dict[str, Any]]:
    """将config.json的slots对象转换为kpc-api-full.json的slots数组格式"""
    slots = []
    for slot_name, slot_info in config_slots.items():
        slot_data = {
            "name": slot_name,
            "description": slot_info.get("description", ""),
            "parameters": []
        }
        slots.append(slot_data)
    return slots

def supplement_component_data(kpc_component: Dict[str, Any], config_component: Dict[str, Any]) -> Dict[str, Any]:
    """补全单个组件的数据"""
    # 补全description
    if config_component.get("description"):
        kpc_component["description"] = config_component["description"]
    
    # 补全props
    if "props" in config_component and config_component["props"]:
        config_props = convert_props_from_config(config_component["props"])
        # 合并现有props和config props
        existing_props = {prop["name"]: prop for prop in kpc_component.get("props", [])}
        
        for config_prop in config_props:
            prop_name = config_prop["name"]
            if prop_name in existing_props:
                # 更新现有prop的描述和选项
                existing_props[prop_name]["description"] = config_prop["description"]
                existing_props[prop_name]["options"] = config_prop["options"]
            else:
                # 添加新的prop
                existing_props[prop_name] = config_prop
        
        kpc_component["props"] = list(existing_props.values())
    
    # 补全events
    if "events" in config_component and config_component["events"]:
        config_events = convert_events_from_config(config_component["events"])
        # 合并现有events和config events
        existing_events = {event["name"]: event for event in kpc_component.get("events", [])}
        
        for config_event in config_events:
            event_name = config_event["name"]
            if event_name in existing_events:
                # 更新现有event的描述
                existing_events[event_name]["description"] = config_event["description"]
            else:
                # 添加新的event
                existing_events[event_name] = config_event
        
        kpc_component["events"] = list(existing_events.values())
    
    # 补全slots (注意config.json中可能拼写为"solt")
    config_slots = config_component.get("solt", {}) or config_component.get("slots", {})
    if config_slots:
        kpc_component["slots"] = convert_slots_from_config(config_slots)
    
    # 补全examples
    if "examples" in config_component and config_component["examples"]:
        kpc_component["examples"] = config_component["examples"]
    
    return kpc_component

def main():
    """主函数"""
    # 文件路径
    kpc_file_path = "data/kpc-api-full.json"
    config_file_path = "data/config.json"
    
    # 检查文件是否存在
    if not os.path.exists(kpc_file_path):
        print(f"错误：文件 {kpc_file_path} 不存在")
        return
    
    if not os.path.exists(config_file_path):
        print(f"错误：文件 {config_file_path} 不存在")
        return
    
    # 加载文件
    print("正在加载文件...")
    kpc_data = load_json_file(kpc_file_path)
    config_data = load_json_file(config_file_path)
    
    # 统计信息
    total_components = len(kpc_data.get("components", {}))
    processed_components = 0
    updated_components = 0
    
    print(f"开始处理 {total_components} 个组件...")
    
    # 补全组件数据
    for component_name, kpc_component in kpc_data.get("components", {}).items():
        if component_name in config_data:
            config_component = config_data[component_name]
            
            # 记录原始数据用于比较
            original_props_count = len(kpc_component.get("props", []))
            original_events_count = len(kpc_component.get("events", []))
            original_slots_count = len(kpc_component.get("slots", []))
            original_examples_count = len(kpc_component.get("examples", []))
            
            # 补全数据
            kpc_data["components"][component_name] = supplement_component_data(kpc_component, config_component)
            
            # 检查是否有更新
            new_props_count = len(kpc_data["components"][component_name].get("props", []))
            new_events_count = len(kpc_data["components"][component_name].get("events", []))
            new_slots_count = len(kpc_data["components"][component_name].get("slots", []))
            new_examples_count = len(kpc_data["components"][component_name].get("examples", []))
            
            if (new_props_count != original_props_count or 
                new_events_count != original_events_count or 
                new_slots_count != original_slots_count or 
                new_examples_count != original_examples_count):
                updated_components += 1
                print(f"  更新组件 {component_name}:")
                print(f"    props: {original_props_count} -> {new_props_count}")
                print(f"    events: {original_events_count} -> {new_events_count}")
                print(f"    slots: {original_slots_count} -> {new_slots_count}")
                print(f"    examples: {original_examples_count} -> {new_examples_count}")
        
        processed_components += 1
        if processed_components % 10 == 0:
            print(f"  已处理 {processed_components}/{total_components} 个组件...")
    
    # 保存补全后的文件
    print("正在保存补全后的文件...")
    save_json_file(kpc_file_path, kpc_data)
    
    print(f"补全完成！")
    print(f"  总组件数: {total_components}")
    print(f"  已处理组件数: {processed_components}")
    print(f"  更新组件数: {updated_components}")
    print(f"  更新后的文件已保存至: {kpc_file_path}")

if __name__ == "__main__":
    main()