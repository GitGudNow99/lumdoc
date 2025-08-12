import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Integrations
  integrations: [
    // Capture console errors
    Sentry.captureConsoleIntegration({
      levels: ['error', 'warn'],
    }),
  ],
  
  // Filtering
  ignoreErrors: [
    // Ignore expected errors
    /429/,
    /Too Many Requests/,
    /AbortError/,
  ],
  
  beforeSend(event, hint) {
    // Add context
    if (event.tags) {
      event.tags.service = 'api';
    }
    
    // Filter sensitive data
    if (event.request?.data) {
      // Remove API keys if accidentally logged
      const data = JSON.stringify(event.request.data);
      if (data.includes('sk-') || data.includes('token')) {
        event.request.data = '[REDACTED]';
      }
    }
    
    return event;
  },
});