/**
 * Analytics & Monitoring Setup
 * Performance monitoring and event tracking
 */

/**
 * Initialize monitoring (Sentry can be added via npm install @sentry/node)
 */
export function initializeSentry() {
  // Sentry initialization
  // To use: npm install @sentry/node @sentry/profiling-node
  // Then uncomment the imports above
  console.log('✓ Monitoring initialized');
}

/**
 * Custom performance monitoring
 */
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  static getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round(avg * 100) / 100,
      median,
      p95,
      p99,
    };
  }

  static getAllMetrics() {
    const result: Record<string, any> = {};
    this.metrics.forEach((_, name) => {
      result[name] = this.getMetrics(name);
    });
    return result;
  }

  static clearMetrics() {
    this.metrics.clear();
  }
}

/**
 * Custom event tracking
 */
export interface CustomEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export class EventTracker {
  private static events: CustomEvent[] = [];
  private static maxEvents = 1000;

  static track(event: CustomEvent) {
    this.events.push({
      ...event,
      timestamp: event.timestamp || new Date(),
    });

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Send to monitoring service
    // Sentry.captureMessage(event.name, 'info', { extra: event.properties });
  }

  static getEvents(name?: string) {
    if (name) {
      return this.events.filter(e => e.name === name);
    }
    return this.events;
  }

  static clearEvents() {
    this.events = [];
  }
}

/**
 * Request/Response logging middleware
 */
export function createLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const originalSend = res.send;

    res.send = function(data: any) {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;

      // Record metrics
      PerformanceMonitor.recordMetric(`http_${req.method}_${statusCode}`, duration);
      PerformanceMonitor.recordMetric('http_request_duration', duration);

      // Track slow requests
      if (duration > 1000) {
        EventTracker.track({
          name: 'slow_request',
          properties: {
            method: req.method,
            path: req.path,
            duration,
            statusCode,
          },
        });
      }

      // Track errors
      if (statusCode >= 400) {
        EventTracker.track({
          name: 'http_error',
          properties: {
            method: req.method,
            path: req.path,
            statusCode,
            duration,
          },
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Error handler middleware
 */
export function createErrorHandler() {
  return (err: any, req: any, res: any, next: any) => {
    console.error('Error:', err);

    // Track error
    EventTracker.track({
      name: 'application_error',
      properties: {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      },
    });

      // Send to monitoring service
      // Sentry.captureException(err);

    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message,
    });
  };
}

/**
 * Health check endpoint
 */
export function getHealthStatus() {
  return {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics: PerformanceMonitor.getAllMetrics(),
  };
}
