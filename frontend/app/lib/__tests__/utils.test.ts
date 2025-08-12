import { describe, expect, it } from '@jest/globals';
import { cn } from '../utils';
import { getCacheKey } from '../services/cache';

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', undefined, false && 'hidden', true && 'visible'))
        .toBe('base visible');
    });

    it('should override Tailwind classes correctly', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });
  });

  describe('getCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const params1 = { query: 'test', version: '2.3' };
      const params2 = { query: 'test', version: '2.3' };
      
      expect(getCacheKey(params1)).toBe(getCacheKey(params2));
    });

    it('should generate different keys for different params', () => {
      const params1 = { query: 'test1', version: '2.3' };
      const params2 = { query: 'test2', version: '2.3' };
      
      expect(getCacheKey(params1)).not.toBe(getCacheKey(params2));
    });

    it('should handle param order consistently', () => {
      const params1 = { query: 'test', version: '2.3', k: 8 };
      const params2 = { k: 8, query: 'test', version: '2.3' };
      
      expect(getCacheKey(params1)).toBe(getCacheKey(params2));
    });
  });
});