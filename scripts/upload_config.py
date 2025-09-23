#!/usr/bin/env python3
"""
CSV to JSON conversion and Cloudflare KV upload script for Stock Notification System.

This script converts config/targets.csv and config/sinks.csv to JSON format
and uploads them to Cloudflare KV namespaces.

Usage:
    python scripts/upload_config.py [--dry-run] [--targets-only] [--sinks-only]

Requirements:
    - wrangler CLI installed and authenticated
    - config/targets.csv and config/sinks.csv files exist
    test
    
"""

import argparse
import csv
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any

PROJECT_ROOT = Path(__file__).parent.parent


def read_csv_to_json(csv_path: Path) -> List[Dict[str, Any]]:
    """Read CSV file and convert to list of dictionaries."""
    if not csv_path.exists():
        print(f"Error: {csv_path} not found")
        sys.exit(1)
    
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if 'enabled' in row and isinstance(row['enabled'], str):
                row['enabled'] = row['enabled'].lower() == 'true'
            rows.append(row)
    return rows


def upload_to_kv(key: str, data: List[Dict[str, Any]], binding: str = "TARGETS", dry_run: bool = False) -> bool:
    """Upload data to Cloudflare KV namespace."""
    if dry_run:
        print(f"[DRY RUN] Would upload to KV key '{key}' with {len(data)} items")
        print(f"Data preview: {json.dumps(data[:2], indent=2, ensure_ascii=False)}")
        return True
    
    try:
        safe_key = key.replace(":", "_")
        temp_file = PROJECT_ROOT / f"temp_{safe_key}.json"
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Created temporary file: {temp_file}")
        print(f"📊 Data to upload: {len(data)} items")
        
        ns_id_env = os.environ.get(f"KV_{binding}_ID")
        ns_id_default = {
            'TARGETS': '785ea4814d824d0194e2045d9b3e6b52',
            'STATE': 'f0a23e908a894a88a2d1633ef469ddad',
        }.get(binding)
        namespace_id = ns_id_env or ns_id_default
        if not namespace_id:
            print(f"❌ No namespace id for binding {binding}. Set env KV_{binding}_ID.")
            return False
        
        cmd = [
            "wrangler", "kv", "key", "put",
            "--remote",
            f"--config=/dev/null",
            f"--namespace-id={namespace_id}",
            key,
            f"--path={str(temp_file)}"
        ]
        
        print(f"🚀 Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(Path.home()))
        
        try:
            temp_file.unlink()
        except Exception:
            pass
        
        if result.returncode == 0:
            print(f"✅ Successfully uploaded {len(data)} items to KV key '{key}'")
            return True
        else:
            print(f"❌ Failed to upload to KV key '{key}':")
            print(result.stdout)
            print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error uploading to KV: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Upload CSV configs to Cloudflare KV")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--targets-only", action="store_true")
    parser.add_argument("--sinks-only", action="store_true")
    parser.add_argument("--skip-wrangler-check", action="store_true")
    args = parser.parse_args()
    
    if not args.skip_wrangler_check:
        try:
            subprocess.run(["wrangler", "--version"], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ Error: wrangler CLI not found.")
            sys.exit(1)
    
    targets_csv = PROJECT_ROOT / "config" / "targets.csv"
    sinks_csv = PROJECT_ROOT / "config" / "sinks.csv"
    
    success = True
    if not args.sinks_only:
        print("📊 Processing targets.csv...")
        success &= upload_to_kv("targets:active", read_csv_to_json(targets_csv), dry_run=args.dry_run)
    if not args.targets_only:
        print("📊 Processing sinks.csv...")
        success &= upload_to_kv("sinks:active", read_csv_to_json(sinks_csv), binding="TARGETS", dry_run=args.dry_run)
    
    if success:
        print("\n🎉 Configuration upload completed successfully!")
        if args.dry_run:
            print("Run without --dry-run to actually upload the data.")
    else:
        print("\n❌ Configuration upload failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
