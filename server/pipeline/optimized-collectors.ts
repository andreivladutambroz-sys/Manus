/**
 * OPTIMIZED COLLECTORS - TASK 2
 * 
 * Features:
 * - Request throttling (2-4 seconds between requests)
 * - Rotating user agents
 * - Retry logic (max 3 retries with exponential backoff)
 * - Store: raw_html, extracted_text, source_url, timestamp, collector_agent_id
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

export interface RawSourceRecord {
  raw_source_id: string;
  source_url: string;
  source_domain: string;
  source_category: 'forum' | 'reddit' | 'obd' | 'blog';
  raw_html: string;
  extracted_text: string;
  text_length: number;
  fetched_at: string;
  status_code: number;
  retry_count: number;
  collector_agent_id: string;
  error?: string;
}

export class OptimizedCollector {
  private client: AxiosInstance;
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 15000;
  private lastFetchTime: { [domain: string]: number } = {};
  private agentId: string;

  // Rotating user agents
  private readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  ];

  constructor(agentId: string) {
    this.agentId = agentId;
    this.client = axios.create({
      timeout: this.TIMEOUT_MS,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    });
  }

  /**
   * Get random user agent
   */
  private getRandomUserAgent(): string {
    return this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
  }

  /**
   * Throttle requests by domain
   */
  private async throttle(domain: string, rateLimitMs: number): Promise<void> {
    const lastTime = this.lastFetchTime[domain] || 0;
    const elapsed = Date.now() - lastTime;

    if (elapsed < rateLimitMs) {
      await new Promise(resolve =>
        setTimeout(resolve, rateLimitMs - elapsed)
      );
    }

    this.lastFetchTime[domain] = Date.now();
  }

  /**
   * Fetch with retry logic and exponential backoff
   */
  private async fetchWithRetry(
    url: string,
    rateLimitMs: number,
    retryCount: number = 0
  ): Promise<{ html: string; statusCode: number } | null> {
    try {
      const domain = new URL(url).hostname;
      await this.throttle(domain, rateLimitMs);

      const response = await this.client.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent()
        }
      });

      return {
        html: response.data,
        statusCode: response.status
      };
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        const backoffMs = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        console.log(`⚠️  Retry ${retryCount + 1}/${this.MAX_RETRIES} for ${url} (backoff: ${backoffMs.toFixed(0)}ms)`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return this.fetchWithRetry(url, rateLimitMs, retryCount + 1);
      }

      console.error(`❌ Fetch failed after ${this.MAX_RETRIES} retries: ${url}`);
      return null;
    }
  }

  /**
   * Extract text from HTML
   */
  private extractText(html: string): string {
    try {
      const $ = cheerio.load(html);

      // Remove script, style, meta tags, etc.
      $('script, style, meta, noscript, link, svg, iframe, button, nav, footer').remove();

      // Extract text
      const text = ($('body').text() || $.text())
        .replace(/\s+/g, ' ')
        .trim();

      return text;
    } catch (error) {
      console.error('Text extraction failed:', error);
      return '';
    }
  }

  /**
   * Collect from URL
   */
  async collect(
    url: string,
    category: 'forum' | 'reddit' | 'obd' | 'blog',
    rateLimitMs: number = 3000
  ): Promise<RawSourceRecord | null> {
    const domain = new URL(url).hostname;
    const raw = await this.fetchWithRetry(url, rateLimitMs);

    if (!raw) {
      return {
        raw_source_id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source_url: url,
        source_domain: domain,
        source_category: category,
        raw_html: '',
        extracted_text: '',
        text_length: 0,
        fetched_at: new Date().toISOString(),
        status_code: 0,
        retry_count: this.MAX_RETRIES,
        collector_agent_id: this.agentId,
        error: 'Failed to fetch after max retries'
      };
    }

    const extractedText = this.extractText(raw.html);
    if (extractedText.length < 100) {
      return null; // Skip if too short
    }

    return {
      raw_source_id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_url: url,
      source_domain: domain,
      source_category: category,
      raw_html: raw.html,
      extracted_text: extractedText,
      text_length: extractedText.length,
      fetched_at: new Date().toISOString(),
      status_code: raw.statusCode,
      retry_count: 0,
      collector_agent_id: this.agentId
    };
  }

  /**
   * Collect from multiple URLs
   */
  async collectBatch(
    urls: Array<{ url: string; category: 'forum' | 'reddit' | 'obd' | 'blog'; rateLimitMs?: number }>
  ): Promise<RawSourceRecord[]> {
    const results: RawSourceRecord[] = [];

    for (const item of urls) {
      const record = await this.collect(item.url, item.category, item.rateLimitMs || 3000);
      if (record) {
        results.push(record);
      }
    }

    return results;
  }
}

export default OptimizedCollector;
