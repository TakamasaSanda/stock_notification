#!/usr/bin/env python3
"""
CSV検証スクリプト
targets.csvの形式を検証し、エラーがあれば詳細を出力する
"""

import csv
import json
import sys
import re
from urllib.parse import urlparse
from typing import Dict, List, Any

def validate_url(url: str) -> bool:
    """URLの形式を検証"""
    if not url:
        return True  # 空文字は許可（x_feed_urlなど）
    
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

def validate_twitter_id(twitter_id: str) -> bool:
    """Twitter IDの形式を検証（@で始まり、英数字とアンダースコアのみ）"""
    if not twitter_id:
        return True  # 空文字は許可
    
    pattern = r'^@[a-zA-Z0-9_]+$'
    return bool(re.match(pattern, twitter_id))

def validate_line_user_id(line_user_id: str) -> bool:
    """LINE User IDの形式を検証（Uで始まる32文字）"""
    if not line_user_id:
        return False  # 必須項目
    
    pattern = r'^U[a-f0-9]{32}$'
    return bool(re.match(pattern, line_user_id))

def validate_boolean(value: str) -> bool:
    """boolean値の検証"""
    return value.lower() in ['true', 'false', '1', '0', 'yes', 'no']

def validate_csv(csv_file: str, schema_file: str = None) -> List[str]:
    """CSVファイルを検証"""
    errors = []
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
    except FileNotFoundError:
        errors.append(f"CSVファイルが見つかりません: {csv_file}")
        return errors
    except Exception as e:
        errors.append(f"CSVファイルの読み込みエラー: {e}")
        return errors
    
    if not rows:
        errors.append("CSVファイルが空です")
        return errors
    
    # 必須カラムの確認
    required_columns = ['tenant_id', 'company_name', 'pr_url', 'twitter_id', 'line_user_id', 'enabled']
    actual_columns = list(rows[0].keys())
    
    for col in required_columns:
        if col not in actual_columns:
            errors.append(f"必須カラムが不足しています: {col}")
    
    # 各行の検証
    for i, row in enumerate(rows, start=2):  # ヘッダー行を考慮して2から開始
        row_errors = []
        
        # tenant_id
        if not row.get('tenant_id', '').strip():
            row_errors.append("tenant_idが空です")
        
        # company_name
        if not row.get('company_name', '').strip():
            row_errors.append("company_nameが空です")
        
        # pr_url
        if not validate_url(row.get('pr_url', '')):
            row_errors.append("pr_urlの形式が正しくありません")
        
        # twitter_id
        if not validate_twitter_id(row.get('twitter_id', '')):
            row_errors.append("twitter_idの形式が正しくありません（@で始まり、英数字とアンダースコアのみ）")
        
        # x_feed_url（オプション）
        if row.get('x_feed_url', '').strip() and not validate_url(row.get('x_feed_url', '')):
            row_errors.append("x_feed_urlの形式が正しくありません")
        
        # line_user_id
        if not validate_line_user_id(row.get('line_user_id', '')):
            row_errors.append("line_user_idの形式が正しくありません（Uで始まる32文字の英数字）")
        
        # enabled
        if not validate_boolean(row.get('enabled', '')):
            row_errors.append("enabledはtrue/falseで指定してください")
        
        if row_errors:
            errors.append(f"行{i}: {', '.join(row_errors)}")
    
    # 重複チェック
    tenant_company_pairs = []
    for i, row in enumerate(rows, start=2):
        pair = (row.get('tenant_id', ''), row.get('company_name', ''))
        if pair in tenant_company_pairs:
            errors.append(f"行{i}: tenant_idとcompany_nameの組み合わせが重複しています: {pair}")
        tenant_company_pairs.append(pair)
    
    return errors

def main():
    if len(sys.argv) < 2:
        print("使用方法: python3 validate_targets.py <csv_file> [schema_file]")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    schema_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    errors = validate_csv(csv_file, schema_file)
    
    if errors:
        print("検証エラー:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    else:
        print("CSV検証が完了しました。エラーはありません。")
        sys.exit(0)

if __name__ == "__main__":
    main()
