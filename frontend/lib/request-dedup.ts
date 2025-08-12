/**
 * Request deduplication to prevent duplicate API calls
 * Caches identical requests that are in-flight
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pending: Map<string, PendingRequest> = new Map();
  private readonly TTL = 5000; // 5 seconds TTL for pending requests

  /**
   * Generate a cache key for the request
   */
  private getKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Clean up expired pending requests
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pending.entries()) {
      if (now - request.timestamp > this.TTL) {
        this.pending.delete(key);
      }
    }
  }

  /**
   * Deduplicate a fetch request
   */
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    this.cleanup();
    
    const key = this.getKey(url, options);
    
    // Check if identical request is already in-flight
    const pending = this.pending.get(key);
    if (pending) {
      console.log('[Dedup] Reusing pending request:', key.slice(0, 50));
      return pending.promise;
    }
    
    // Create new request
    const promise = fetch(url, options);
    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
    });
    
    // Clean up after completion
    promise.finally(() => {
      this.pending.delete(key);
    });
    
    return promise;
  }

  /**
   * Get stats about pending requests
   */
  getStats(): { pendingCount: number; keys: string[] } {
    this.cleanup();
    return {
      pendingCount: this.pending.size,
      keys: Array.from(this.pending.keys()),
    };
  }
}

// Export singleton instance
export const dedup = new RequestDeduplicator();

/**
 * Deduplicated fetch wrapper
 * Use this instead of fetch() for API calls that might be duplicated
 */
export async function dedupFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return dedup.fetch(url, options);
}

/**
 * Hook for React components to deduplicate API calls
 */
export function useDedupFetch() {
  return {
    fetch: dedupFetch,
    getStats: () => dedup.getStats(),
  };
}