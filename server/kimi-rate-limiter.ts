/**
 * Global Kimi API Rate Limiter
 * Enforces 5 requests per minute across ALL agents
 * Uses in-memory queue with sliding window algorithm
 */

import { EventEmitter } from "events";

interface RateLimitConfig {
  maxRequests: number; // 5 requests
  windowMs: number; // 60,000ms (1 minute)
  checkIntervalMs: number; // 1000ms (cleanup interval)
}

interface RequestToken {
  agentId: string;
  timestamp: number;
  tokens: number; // Estimated tokens for this request
}

export class KimiRateLimiter extends EventEmitter {
  private config: RateLimitConfig;
  private requestQueue: RequestToken[] = [];
  private waitingQueue: Array<{
    agentId: string;
    resolve: () => void;
    reject: (err: Error) => void;
    estimatedTokens: number;
  }> = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private totalRequestsAllTime = 0;
  private totalTokensAllTime = 0;

  constructor(config: Partial<RateLimitConfig> = {}) {
    super();
    this.config = {
      maxRequests: config.maxRequests || 5,
      windowMs: config.windowMs || 60000, // 1 minute
      checkIntervalMs: config.checkIntervalMs || 1000,
    };

    this.startCleanupInterval();
  }

  /**
   * Request permission to make a Kimi API call
   * Returns a promise that resolves when request is allowed
   */
  async acquireToken(agentId: string, estimatedTokens = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = Date.now();

      // Check if we can immediately grant the token
      if (this.canMakeRequest(now)) {
        this.requestQueue.push({
          agentId,
          timestamp: now,
          tokens: estimatedTokens,
        });
        this.totalRequestsAllTime++;
        this.totalTokensAllTime += estimatedTokens;

        this.emit("request_allowed", {
          agentId,
          queueLength: this.requestQueue.length,
          waitingAgents: this.waitingQueue.length,
        });

        resolve();
      } else {
        // Queue the request
        this.waitingQueue.push({
          agentId,
          resolve,
          reject,
          estimatedTokens,
        });

        this.emit("request_queued", {
          agentId,
          waitingPosition: this.waitingQueue.length,
          estimatedWaitMs: this.estimateWaitTime(),
        });
      }
    });
  }

  /**
   * Check if a request can be made right now
   */
  private canMakeRequest(now: number): boolean {
    // Remove expired requests from queue
    this.requestQueue = this.requestQueue.filter(
      (req) => now - req.timestamp < this.config.windowMs
    );

    // Check if we have capacity
    return this.requestQueue.length < this.config.maxRequests;
  }

  /**
   * Process waiting queue
   */
  private processWaitingQueue(): void {
    const now = Date.now();

    while (this.waitingQueue.length > 0 && this.canMakeRequest(now)) {
      const waiting = this.waitingQueue.shift();
      if (waiting) {
        this.requestQueue.push({
          agentId: waiting.agentId,
          timestamp: now,
          tokens: waiting.estimatedTokens,
        });
        this.totalRequestsAllTime++;
        this.totalTokensAllTime += waiting.estimatedTokens;

        this.emit("request_allowed", {
          agentId: waiting.agentId,
          fromQueue: true,
          queueLength: this.requestQueue.length,
          waitingAgents: this.waitingQueue.length,
        });

        waiting.resolve();
      }
    }
  }

  /**
   * Estimate wait time for next request
   */
  private estimateWaitTime(): number {
    if (this.requestQueue.length === 0) return 0;

    const oldestRequest = this.requestQueue[0];
    const now = Date.now();
    const timeUntilExpiry =
      this.config.windowMs - (now - oldestRequest.timestamp);

    return Math.max(0, timeUntilExpiry);
  }

  /**
   * Get current rate limit status
   */
  getStatus() {
    const now = Date.now();
    this.requestQueue = this.requestQueue.filter(
      (req) => now - req.timestamp < this.config.windowMs
    );

    return {
      currentRequests: this.requestQueue.length,
      maxRequests: this.config.maxRequests,
      availableSlots: Math.max(
        0,
        this.config.maxRequests - this.requestQueue.length
      ),
      waitingAgents: this.waitingQueue.length,
      estimatedWaitMs: this.estimateWaitTime(),
      totalRequestsAllTime: this.totalRequestsAllTime,
      totalTokensAllTime: this.totalTokensAllTime,
      requestTimestamps: this.requestQueue.map((r) => ({
        agentId: r.agentId,
        ageMs: now - r.timestamp,
        tokens: r.tokens,
      })),
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const now = Date.now();
    const recentRequests = this.requestQueue.filter(
      (req) => now - req.timestamp < this.config.windowMs
    );

    const requestsPerAgent = new Map<string, number>();
    const tokensPerAgent = new Map<string, number>();

    recentRequests.forEach((req) => {
      requestsPerAgent.set(
        req.agentId,
        (requestsPerAgent.get(req.agentId) || 0) + 1
      );
      tokensPerAgent.set(
        req.agentId,
        (tokensPerAgent.get(req.agentId) || 0) + req.tokens
      );
    });

    return {
      windowMs: this.config.windowMs,
      maxRequests: this.config.maxRequests,
      currentRequests: recentRequests.length,
      waitingAgents: this.waitingQueue.length,
      requestsPerAgent: Object.fromEntries(requestsPerAgent),
      tokensPerAgent: Object.fromEntries(tokensPerAgent),
      totalTokensInWindow: recentRequests.reduce((sum, r) => sum + r.tokens, 0),
      totalRequestsAllTime: this.totalRequestsAllTime,
      totalTokensAllTime: this.totalTokensAllTime,
    };
  }

  /**
   * Reset all counters (for testing)
   */
  reset(): void {
    this.requestQueue = [];
    this.waitingQueue.forEach((w) =>
      w.reject(new Error("Rate limiter reset"))
    );
    this.waitingQueue = [];
    this.totalRequestsAllTime = 0;
    this.totalTokensAllTime = 0;
    this.emit("reset");
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.processWaitingQueue();
      this.emit("tick", this.getStatus());
    }, this.config.checkIntervalMs);
  }

  /**
   * Stop cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.removeAllListeners();
  }
}

// Global singleton instance
let globalLimiter: KimiRateLimiter | null = null;

/**
 * Get or create global rate limiter
 */
export function getGlobalKimiRateLimiter(): KimiRateLimiter {
  if (!globalLimiter) {
    globalLimiter = new KimiRateLimiter({
      maxRequests: 5, // 5 requests per minute
      windowMs: 60000, // 1 minute
      checkIntervalMs: 1000, // Check every second
    });

    // Log events in development
    if (process.env.NODE_ENV === "development") {
      globalLimiter.on("request_allowed", (data) => {
        console.log(
          `[RateLimit] ✅ Request allowed for ${data.agentId} (queue: ${data.queueLength}, waiting: ${data.waitingAgents})`
        );
      });

      globalLimiter.on("request_queued", (data) => {
        console.log(
          `[RateLimit] ⏳ Request queued for ${data.agentId} (position: ${data.waitingPosition}, wait: ${data.estimatedWaitMs}ms)`
        );
      });
    }
  }

  return globalLimiter;
}

/**
 * Middleware for Express to check rate limits
 */
export function kimiRateLimitMiddleware(
  req: any,
  res: any,
  next: any
): void {
  const limiter = getGlobalKimiRateLimiter();
  const agentId = req.headers["x-agent-id"] || "unknown";

  limiter
    .acquireToken(agentId, 0)
    .then(() => {
      res.set("X-RateLimit-Status", "allowed");
      next();
    })
    .catch((err) => {
      res.status(429).json({
        error: "Rate limit exceeded",
        message: err.message,
        retryAfter: limiter.getStatus().estimatedWaitMs,
      });
    });
}

export default KimiRateLimiter;
