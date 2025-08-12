#!/usr/bin/env python3
"""
Backup Algolia index to JSON files
"""

import os
import json
import asyncio
from datetime import datetime
from pathlib import Path
import httpx

async def backup_algolia():
    app_id = os.getenv("ALGOLIA_APP_ID")
    api_key = os.getenv("ALGOLIA_API_KEY")
    
    if not app_id or not api_key:
        print("Missing Algolia credentials")
        return
    
    backup_dir = Path(f"backups/{datetime.now().strftime('%Y%m%d')}/algolia")
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    async with httpx.AsyncClient() as client:
        # Browse index to get all records
        browse_url = f"https://{app_id}-dsn.algolia.net/1/indexes/ma3_docs/browse"
        headers = {
            "X-Algolia-Application-Id": app_id,
            "X-Algolia-API-Key": api_key,
        }
        
        all_records = []
        cursor = None
        page = 0
        
        while True:
            params = {"hitsPerPage": 1000}
            if cursor:
                params["cursor"] = cursor
            
            response = await client.get(browse_url, headers=headers, params=params)
            
            if response.status_code != 200:
                print(f"Error fetching page {page}: {response.text}")
                break
            
            data = response.json()
            hits = data.get("hits", [])
            all_records.extend(hits)
            
            print(f"Fetched page {page} with {len(hits)} records")
            
            cursor = data.get("cursor")
            if not cursor:
                break
            
            page += 1
        
        # Save records
        output_file = backup_dir / f"records_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump({
                "index": "ma3_docs",
                "timestamp": datetime.now().isoformat(),
                "count": len(all_records),
                "records": all_records
            }, f, indent=2)
        
        print(f"Backed up {len(all_records)} records to {output_file}")
        
        # Also get index settings
        settings_url = f"https://{app_id}-dsn.algolia.net/1/indexes/ma3_docs/settings"
        settings_response = await client.get(settings_url, headers=headers)
        
        if settings_response.status_code == 200:
            settings_file = backup_dir / "settings.json"
            with open(settings_file, 'w') as f:
                json.dump(settings_response.json(), f, indent=2)
            print(f"Backed up index settings to {settings_file}")

if __name__ == "__main__":
    asyncio.run(backup_algolia())