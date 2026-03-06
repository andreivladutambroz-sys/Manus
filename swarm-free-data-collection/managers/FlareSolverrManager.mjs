/**
 * FlareSolverr Manager - FREE Cloudflare Bypass Proxy
 * 
 * Connects to FlareSolverr API (http://localhost:8191) to bypass Cloudflare
 * Uses real Chrome browser via Selenium (undetected-chromedriver)
 * 
 * Cost: $0 (open-source, MIT license)
 * GitHub: https://github.com/FlareSolverr/FlareSolverr
 */

import axios from 'axios';

export class FlareSolverrManager {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || process.env.FLARESOLVERR_API || 'http://localhost:8191/v1';
    this.maxTimeout = config.maxTimeout || 60000;
    this.sessions = new Map(); // Track active sessions
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalBytesDownloaded: 0
    };
  }

  /**
   * Create a persistent session for reusing browser instance
   * Speeds up requests by avoiding browser startup overhead
   */
  async createSession(sessionId = null) {
    try {
      const id = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await axios.post(this.apiUrl, {
        cmd: 'sessions.create'
      });

      if (response.data.success) {
        this.sessions.set(id, {
          sessionId: response.data.session,
          createdAt: new Date(),
          requestCount: 0
        });
        console.log(`[FlareSolverr] Session created: ${id}`);
        return id;
      } else {
        throw new Error(response.data.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('[FlareSolverr] Session creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Scrape URL with Cloudflare bypass
   * Returns HTML content and cookies
   */
  async scrapeUrl(url, sessionId = null) {
    try {
      this.stats.totalRequests++;

      const payload = {
        cmd: 'request.get',
        url: url,
        maxTimeout: this.maxTimeout,
        returnOnlyCookies: false
      };

      // Use persistent session if provided
      if (sessionId && this.sessions.has(sessionId)) {
        const session = this.sessions.get(sessionId);
        payload.session = session.sessionId;
        session.requestCount++;
      }

      console.log(`[FlareSolverr] Scraping: ${url}${sessionId ? ` (session: ${sessionId})` : ''}`);

      const response = await axios.post(this.apiUrl, payload, {
        timeout: this.maxTimeout + 5000
      });

      if (response.data.success) {
        const solution = response.data.solution;
        this.stats.successfulRequests++;
        this.stats.totalBytesDownloaded += solution.response.length;

        return {
          success: true,
          html: solution.response,
          cookies: solution.cookies,
          status: solution.status,
          headers: solution.headers,
          url: solution.url
        };
      } else {
        throw new Error(response.data.message || 'FlareSolverr request failed');
      }
    } catch (error) {
      this.stats.failedRequests++;
      console.error(`[FlareSolverr] Scrape failed for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Scrape multiple URLs in sequence using same session
   */
  async scrapeMultiple(urls, sessionId = null) {
    const results = [];
    
    // Create session if not provided
    let session = sessionId;
    if (!session) {
      session = await this.createSession();
    }

    for (const url of urls) {
      try {
        const result = await this.scrapeUrl(url, session);
        results.push({
          url,
          success: true,
          ...result
        });
        
        // Delay between requests to avoid rate limiting
        await new Promise(r => setTimeout(r, 2000));
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Destroy session to free browser resources
   */
  async destroySession(sessionId) {
    try {
      if (!this.sessions.has(sessionId)) {
        console.warn(`[FlareSolverr] Session not found: ${sessionId}`);
        return false;
      }

      const session = this.sessions.get(sessionId);
      
      await axios.post(this.apiUrl, {
        cmd: 'sessions.destroy',
        session: session.sessionId
      });

      this.sessions.delete(sessionId);
      console.log(`[FlareSolverr] Session destroyed: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('[FlareSolverr] Session destruction failed:', error.message);
      return false;
    }
  }

  /**
   * Destroy all active sessions
   */
  async destroyAllSessions() {
    const sessionIds = Array.from(this.sessions.keys());
    
    for (const sessionId of sessionIds) {
      await this.destroySession(sessionId);
    }

    console.log(`[FlareSolverr] All ${sessionIds.length} sessions destroyed`);
  }

  /**
   * Get statistics about proxy usage
   */
  getStats() {
    return {
      ...this.stats,
      activeSessions: this.sessions.size,
      successRate: this.stats.totalRequests > 0 
        ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
        : 'N/A',
      averageBytesPerRequest: this.stats.successfulRequests > 0
        ? (this.stats.totalBytesDownloaded / this.stats.successfulRequests).toFixed(0) + ' bytes'
        : 'N/A'
    };
  }

  /**
   * Health check - verify FlareSolverr is running
   */
  async healthCheck() {
    try {
      const response = await axios.post(this.apiUrl, {
        cmd: 'request.get',
        url: 'http://www.google.com/',
        maxTimeout: 30000
      });

      return {
        healthy: response.data.success,
        message: 'FlareSolverr is running and responsive'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `FlareSolverr health check failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

export default FlareSolverrManager;
