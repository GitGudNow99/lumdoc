#!/usr/bin/env python3
"""
Lightweight crawler for GitHub Actions
Crawls grandMA3 docs and saves to JSON files
"""

import asyncio
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Set
from urllib.parse import urljoin, urlparse
import argparse
import re

from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

class LightweightCrawler:
    def __init__(self, version: str = "2.3", output_dir: str = "./data"):
        self.version = version
        self.base_url = f"https://help.malighting.com/grandMA3/{version}/HTML/"
        self.output_dir = Path(output_dir) / "raw" / version
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.visited_urls: Set[str] = set()
        self.documents: List[Dict] = []
        
    async def crawl(self, max_pages: int = 100):
        print(f"Starting crawl of grandMA3 v{self.version} docs...")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            
            # Start from help page (main table of contents)
            queue = [self.base_url + "help.html"]
            pages_crawled = 0
            
            while queue and pages_crawled < max_pages:
                url = queue.pop(0)
                if url in self.visited_urls:
                    continue
                    
                page_data = await self._crawl_page(context, url)
                if page_data:
                    self.documents.append(page_data)
                    pages_crawled += 1
                    
                    if pages_crawled % 10 == 0:
                        print(f"Crawled {pages_crawled} pages...")
                    
                    # Add new URLs to queue
                    for link in page_data.get("links", []):
                        if self._should_crawl(link):
                            queue.append(link)
                
                # Rate limiting
                await asyncio.sleep(0.3)
            
            await browser.close()
            
        # Save all documents
        self._save_documents()
        print(f"Crawl complete. {pages_crawled} pages saved to {self.output_dir}")
    
    async def _crawl_page(self, context, url: str) -> Dict:
        self.visited_urls.add(url)
        
        try:
            page = await context.new_page()
            await page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Wait for JavaScript content to load
            try:
                # Wait for the main content area or navigation
                await page.wait_for_selector('.topic-content, .nav-tree, .content-area, #content, .main', timeout=5000)
            except:
                # If selectors not found, wait a bit anyway
                await asyncio.sleep(2)
            
            html = await page.content()
            soup = BeautifulSoup(html, "lxml")
            
            # Extract content
            title = soup.find("title").text if soup.find("title") else ""
            
            content_elem = (
                soup.find(class_="content-wrapper") or
                soup.find("main") or
                soup.find("article") or
                soup.find(id="content") or
                soup.find(class_="topic-content") or
                soup.find(class_="main-content") or
                soup.body
            )
            
            if not content_elem:
                await page.close()
                return None
            
            # Extract text and code
            text = self._clean_text(content_elem.get_text())
            code_blocks = [
                code.get_text(strip=True) 
                for code in content_elem.find_all(["pre", "code"])
                if code.get_text(strip=True)
            ]
            
            # Extract links from both content and JavaScript-generated navigation
            links = []
            # First try to get all links on the page
            all_links = soup.find_all("a", href=True)
            for a in all_links:
                href = urljoin(url, a["href"])
                if self._is_same_host(href, self.base_url) and href.endswith('.html'):
                    links.append(href.split("#")[0])
            
            # Also try to extract links using JavaScript evaluation
            try:
                js_links = await page.evaluate("""
                    () => {
                        const links = [];
                        document.querySelectorAll('a[href]').forEach(a => {
                            if (a.href && a.href.includes('.html')) {
                                links.push(a.href);
                            }
                        });
                        return links;
                    }
                """)
                for link in js_links:
                    if self._is_same_host(link, self.base_url):
                        links.append(link.split("#")[0])
            except:
                pass
            
            await page.close()
            
            return {
                "url": url,
                "version": self.version,
                "title": title,
                "text": text,
                "code_blocks": code_blocks[:5],  # Limit code blocks
                "links": list(set(links))[:20],  # Limit links
                "hash": hashlib.sha256(text.encode()).hexdigest()[:16],
            }
            
        except Exception as e:
            print(f"Error crawling {url}: {e}")
            return None
    
    def _clean_text(self, text: str) -> str:
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[\u200b\u00a0]', ' ', text)
        return text.strip()[:5000]  # Limit text length
    
    def _should_crawl(self, url: str) -> bool:
        if url in self.visited_urls:
            return False
        if not url.startswith(self.base_url):
            return False
        if any(url.endswith(ext) for ext in ['.pdf', '.jpg', '.png', '.zip']):
            return False
        return True
    
    def _is_same_host(self, url: str, base: str) -> bool:
        return urlparse(url).netloc == urlparse(base).netloc
    
    def _save_documents(self):
        output_file = self.output_dir / "documents.json"
        with open(output_file, 'w') as f:
            json.dump(self.documents, f, indent=2)
        print(f"Saved {len(self.documents)} documents to {output_file}")

async def main():
    parser = argparse.ArgumentParser(description='Crawl grandMA3 documentation')
    parser.add_argument('--version', default='2.3', help='grandMA3 version')
    parser.add_argument('--max-pages', type=int, default=100, help='Maximum pages to crawl')
    parser.add_argument('--output', default='./data', help='Output directory')
    
    args = parser.parse_args()
    
    crawler = LightweightCrawler(
        version=args.version,
        output_dir=args.output
    )
    await crawler.crawl(max_pages=args.max_pages)

if __name__ == "__main__":
    asyncio.run(main())