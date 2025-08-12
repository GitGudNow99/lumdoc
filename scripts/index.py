#!/usr/bin/env python3
"""
Index documents to Upstash Vector and Algolia
Runs in GitHub Actions after crawling
"""

import json
import os
import hashlib
import argparse
from pathlib import Path
from typing import List, Dict
import asyncio

import httpx
from openai import OpenAI

# Initialize clients with better error handling
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError(
        "OPENAI_API_KEY environment variable is not set. "
        "Please add it to your GitHub repository secrets:\n"
        "1. Go to Settings > Secrets and variables > Actions\n"
        "2. Add a new repository secret named OPENAI_API_KEY\n"
        "3. Set the value to your OpenAI API key"
    )

openai_client = OpenAI(api_key=api_key)

class DocumentIndexer:
    def __init__(self, version: str = "2.3"):
        self.version = version
        self.upstash_url = os.getenv("UPSTASH_VECTOR_REST_URL")
        self.upstash_token = os.getenv("UPSTASH_VECTOR_REST_TOKEN")
        self.algolia_app_id = os.getenv("ALGOLIA_APP_ID")
        self.algolia_api_key = os.getenv("ALGOLIA_API_KEY")
        
        # Validate required environment variables
        missing_vars = []
        if not self.upstash_url:
            missing_vars.append("UPSTASH_VECTOR_REST_URL")
        if not self.upstash_token:
            missing_vars.append("UPSTASH_VECTOR_REST_TOKEN")
        if not self.algolia_app_id:
            missing_vars.append("ALGOLIA_APP_ID")
        if not self.algolia_api_key:
            missing_vars.append("ALGOLIA_API_KEY")
        
        if missing_vars:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing_vars)}\n"
                "Please add them to your GitHub repository secrets."
            )
        
    async def index_documents(self, input_dir: str = "./data"):
        print(f"Starting indexing for version {self.version}...")
        
        # Load documents
        docs_file = Path(input_dir) / "raw" / self.version / "documents.json"
        with open(docs_file, 'r') as f:
            documents = json.load(f)
        
        print(f"Loaded {len(documents)} documents")
        
        # Process into chunks
        chunks = []
        for doc in documents:
            chunks.extend(self._chunk_document(doc))
        
        print(f"Created {len(chunks)} chunks")
        
        # Index to Upstash Vector
        await self._index_to_upstash(chunks)
        
        # Index to Algolia
        await self._index_to_algolia(chunks)
        
        print("Indexing complete!")
    
    def _chunk_document(self, doc: Dict) -> List[Dict]:
        """Simple chunking - split text into ~500 token chunks"""
        chunks = []
        text = doc["text"]
        
        # Rough approximation: 1 token ≈ 4 characters
        chunk_size = 2000  # ~500 tokens
        overlap = 200
        
        for i in range(0, len(text), chunk_size - overlap):
            chunk_text = text[i:i + chunk_size]
            
            if len(chunk_text) < 100:  # Skip tiny chunks
                continue
            
            chunk_id = hashlib.sha256(
                f"{doc['url']}_{i}_{chunk_text[:50]}".encode()
            ).hexdigest()[:16]
            
            chunk = {
                "id": chunk_id,
                "text": chunk_text,
                "url": doc["url"],
                "title": doc["title"],
                "version": doc["version"],
                "section_path": doc["title"],  # Simplified
                "code_blocks": self._extract_relevant_code(chunk_text, doc.get("code_blocks", [])),
            }
            chunks.append(chunk)
        
        return chunks
    
    def _extract_relevant_code(self, text: str, code_blocks: List[str]) -> List[str]:
        """Find code blocks relevant to this chunk"""
        relevant = []
        text_lower = text.lower()
        
        for code in code_blocks:
            # Simple relevance check
            if any(word in code.lower() for word in text_lower.split()[:20]):
                relevant.append(code)
                if len(relevant) >= 2:
                    break
        
        return relevant
    
    async def _index_to_upstash(self, chunks: List[Dict]):
        """Index to Upstash Vector using REST API"""
        print("Indexing to Upstash Vector...")
        
        # Generate embeddings
        texts = [c["text"] for c in chunks]
        
        # Batch embed (OpenAI allows up to 2048 inputs)
        batch_size = 100
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=batch,
                dimensions=1536
            )
            all_embeddings.extend([e.embedding for e in response.data])
            print(f"Embedded batch {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size}")
        
        # Prepare vectors for Upstash
        vectors = []
        for chunk, embedding in zip(chunks, all_embeddings):
            vectors.append({
                "id": chunk["id"],
                "vector": embedding,
                "metadata": {
                    "text": chunk["text"],
                    "url": chunk["url"],
                    "title": chunk["title"],
                    "version": chunk["version"],
                    "section_path": chunk["section_path"],
                    "code_blocks": chunk["code_blocks"],
                }
            })
        
        # Upsert to Upstash in batches
        async with httpx.AsyncClient() as client:
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                
                response = await client.post(
                    f"{self.upstash_url}/upsert",
                    headers={"Authorization": f"Bearer {self.upstash_token}"},
                    json=batch,
                    timeout=30
                )
                
                if response.status_code != 200:
                    print(f"Upstash error: {response.text}")
                else:
                    print(f"Upserted batch {i//batch_size + 1} to Upstash")
        
        print(f"Indexed {len(vectors)} vectors to Upstash")
    
    async def _index_to_algolia(self, chunks: List[Dict]):
        """Index to Algolia using REST API"""
        print("Indexing to Algolia...")
        
        # Prepare records for Algolia
        records = []
        for chunk in chunks:
            records.append({
                "objectID": chunk["id"],
                "text": chunk["text"],
                "url": chunk["url"],
                "title": chunk["title"],
                "version": chunk["version"],
                "section_path": chunk["section_path"],
                "code_blocks": " ".join(chunk["code_blocks"]) if chunk["code_blocks"] else "",
            })
        
        # Index to Algolia
        async with httpx.AsyncClient() as client:
            # Batch index
            batch_size = 1000
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                
                response = await client.post(
                    f"https://{self.algolia_app_id}.algolia.net/1/indexes/ma3_docs/batch",
                    headers={
                        "X-Algolia-Application-Id": self.algolia_app_id,
                        "X-Algolia-API-Key": self.algolia_api_key,
                    },
                    json={"requests": [{"action": "addObject", "body": r} for r in batch]},
                    timeout=30
                )
                
                if response.status_code != 200:
                    print(f"Algolia error: {response.text}")
                else:
                    print(f"Indexed batch {i//batch_size + 1} to Algolia")
        
        print(f"Indexed {len(records)} documents to Algolia")

async def main():
    parser = argparse.ArgumentParser(description='Index grandMA3 documentation')
    parser.add_argument('--version', default='2.3', help='grandMA3 version')
    parser.add_argument('--input', default='./data', help='Input directory')
    
    args = parser.parse_args()
    
    indexer = DocumentIndexer(version=args.version)
    await indexer.index_documents(input_dir=args.input)

if __name__ == "__main__":
    asyncio.run(main())