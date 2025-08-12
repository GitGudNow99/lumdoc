import { describe, expect, it, jest } from '@jest/globals';
import { getIdentifier, rateLimitResponse } from '../ratelimit';

describe('Rate Limiting', () => {
  describe('getIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });
      
      expect(getIdentifier(request)).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });
      
      expect(getIdentifier(request)).toBe('192.168.1.2');
    });

    it('should return anonymous for missing IP', () => {
      const request = new Request('http://localhost');
      expect(getIdentifier(request)).toBe('anonymous');
    });

    it('should prioritize x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
        },
      });
      
      expect(getIdentifier(request)).toBe('192.168.1.1');
    });
  });

  describe('rateLimitResponse', () => {
    it('should return 429 status', () => {
      const response = rateLimitResponse();
      expect(response.status).toBe(429);
    });

    it('should include retry-after header', () => {
      const response = rateLimitResponse();
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    it('should include custom message', () => {
      const response = rateLimitResponse('Custom rate limit message');
      response.json().then(data => {
        expect(data.message).toBe('Custom rate limit message');
      });
    });

    it('should have correct content type', () => {
      const response = rateLimitResponse();
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});