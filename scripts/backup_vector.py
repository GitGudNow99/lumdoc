#!/usr/bin/env python3
"""
Backup Upstash Vector index
"""

import os
import json
import asyncio
from datetime import datetime
from pathlib import Path
import httpx

async def backup_upstash_vector():
    url = os.getenv("UPSTASH_VECTOR_REST_URL")
    token = os.getenv("UPSTASH_VECTOR_REST_TOKEN")
    
    if not url or not token:
        print("Missing Upstash credentials")
        return
    
    backup_dir = Path(f"backups/{datetime.now().strftime('%Y%m%d')}/vector")
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get index info
        info_response = await client.get(f"{url}/info", headers=headers)
        if info_response.status_code == 200:
            info_file = backup_dir / "info.json"
            with open(info_file, 'w') as f:
                json.dump(info_response.json(), f, indent=2)
            print(f"Backed up index info to {info_file}")
        
        # Fetch vectors (limited to metadata only for size)
        # Note: Upstash Vector doesn't have a browse endpoint, 
        # so we'd need to implement cursor-based fetching
        
        # For now, save a sample query to verify the index is working
        sample_query = {
            "vector": [0.1] * 1536,  # Dummy vector
            "topK": 5,
            "includeMetadata": True,
        }
        
        query_response = await client.post(
            f"{url}/query",
            headers=headers,
            json=sample_query,
            timeout=30
        )
        
        if query_response.status_code == 200:
            sample_file = backup_dir / f"sample_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(sample_file, 'w') as f:
                json.dump({
                    "timestamp": datetime.now().isoformat(),
                    "sample_results": query_response.json(),
                    "status": "healthy"
                }, f, indent=2)
            print(f"Saved sample query results to {sample_file}")
        
        # Note: For full backup, you'd need to:
        # 1. Keep track of all vector IDs during insertion
        # 2. Fetch vectors in batches using those IDs
        # 3. Store vectors and metadata separately
        
        print("Note: Full vector backup requires tracking IDs during insertion")

if __name__ == "__main__":
    asyncio.run(backup_upstash_vector())