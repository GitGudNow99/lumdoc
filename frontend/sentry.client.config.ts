import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 0.5, // 50% of sessions with errors
  
  // Release tracking
  environment: process.env.NODE_ENV,
  
  // Filtering
  ignoreErrors: [
    // Ignore rate limit errors (expected)
    /429/,
    /Too Many Requests/,
    // Ignore network errors
    /NetworkError/,
    /Failed to fetch/,
  ],
  
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event);
      return null;
    }
    
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    
    return event;
  },
});