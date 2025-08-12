import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Lower sample rate for edge functions
  tracesSampleRate: 0.05,
  
  environment: process.env.NODE_ENV,
  
  // Edge-specific configuration
  transportOptions: {
    // Note: timeout is not available in standard fetch options
  },
});