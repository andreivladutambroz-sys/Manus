/**
 * STAGE A: RAW DATA COLLECTOR
 * 
 * Fetches raw HTML/JSON from sources and stores extracted text.
 * NO record creation. NO fabrication.
 * 
 * Output: raw_source_id + extracted_text only
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

export interface RawSource {
  raw_source_id: string;
  source_url: string;
  source_domain: string;
  fetched_at: string;
  status_code: number;
  content_type: string;
  raw_html: string;
  extracted_text: string;
  text_length: number;
  text_sha256: string;
  fetch_duration_ms: number;
  error?: string;
}

export class StageARawCollector {
  private axiosInstance = axios.create({
    timeout: 15000,
    headers: {
      'User-Agent': 'MechanicHelper-Bot/1.0 (+https://mechanic-helper.local)'
    }
  });

  private rateLimitMap = new Map<string, number>();

  /**
   * Fetch raw HTML from URL with rate limiting
   */
  async fetchRawSource(url: string, domainRateLimit: number = 100): Promise<RawSource | null> {
    try {
      const domain = new URL(url).hostname;
      
      // Rate limiting: 10 requests per minute per domain
      const now = Date.now();
      const lastFetch = this.rateLimitMap.get(domain) || 0;
      const timeSinceLastFetch = now - lastFetch;
      
      if (timeSinceLastFetch < domainRateLimit) {
        console.log(`⏳ Rate limit: waiting ${domainRateLimit - timeSinceLastFetch}ms for ${domain}`);
        await new Promise(resolve => setTimeout(resolve, domainRateLimit - timeSinceLastFetch));
      }
      
      this.rateLimitMap.set(domain, Date.now());

      const startTime = Date.now();
      const response = await this.axiosInstance.get(url);
      const fetchDuration = Date.now() - startTime;

      // Extract text from HTML
      const extractedText = this.extractTextFromHTML(response.data);
      
      if (!extractedText || extractedText.length < 100) {
        console.warn(`⚠️ Extracted text too short (${extractedText.length} chars) from ${url}`);
        return null;
      }

      // Generate SHA256 hash of extracted text
      const textSha256 = crypto.createHash('sha256').update(extractedText).digest('hex');
      
      // Generate unique raw_source_id
      const raw_source_id = `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const rawSource: RawSource = {
        raw_source_id,
        source_url: url,
        source_domain: domain,
        fetched_at: new Date().toISOString(),
        status_code: response.status,
        content_type: response.headers['content-type'] || 'text/html',
        raw_html: response.data,
        extracted_text: extractedText,
        text_length: extractedText.length,
        text_sha256: textSha256,
        fetch_duration_ms: fetchDuration
      };

      console.log(`✅ Fetched: ${url} (${extractedText.length} chars, ${fetchDuration}ms)`);
      return rawSource;
    } catch (error: any) {
      console.error(`❌ Fetch failed: ${url}`, error.message);
      return null;
    }
  }

  /**
   * Extract readable text from HTML
   */
  private extractTextFromHTML(html: string): string {
    try {
      const $ = cheerio.load(html);
      
      // Remove script, style, and meta tags
      $('script, style, meta, noscript, link').remove();
      
      // Extract text from body or entire document
      const text = $('body').text() || $.text();
      
      // Clean up whitespace
      const cleaned = text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      
      return cleaned;
    } catch (error) {
      console.error('Error extracting text from HTML:', error);
      return '';
    }
  }

  /**
   * Batch fetch multiple URLs
   */
  async fetchMultipleSources(urls: string[]): Promise<RawSource[]> {
    const results: RawSource[] = [];
    
    for (const url of urls) {
      const rawSource = await this.fetchRawSource(url);
      if (rawSource) {
        results.push(rawSource);
      }
    }
    
    return results;
  }

  /**
   * Store raw source to database (for audit trail)
   */
  async storeRawSource(rawSource: RawSource, db: any): Promise<boolean> {
    try {
      // Store in a raw_sources table for audit
      await db.execute(`
        INSERT INTO raw_sources (
          raw_source_id, source_url, source_domain, fetched_at,
          status_code, content_type, extracted_text, text_sha256,
          fetch_duration_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        rawSource.raw_source_id,
        rawSource.source_url,
        rawSource.source_domain,
        rawSource.fetched_at,
        rawSource.status_code,
        rawSource.content_type,
        rawSource.extracted_text,
        rawSource.text_sha256,
        rawSource.fetch_duration_ms
      ]);
      
      console.log(`💾 Stored raw source: ${rawSource.raw_source_id}`);
      return true;
    } catch (error) {
      console.error('Error storing raw source:', error);
      return false;
    }
  }
}

export default StageARawCollector;
