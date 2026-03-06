/**
 * MULTI-SOURCE DATA COLLECTORS
 * 
 * Collects raw data from:
 * 1. Marketplace listings (AutoScout24, Mobile.de, eBay Motors, Facebook)
 * 2. Salvage auctions (Copart, IAA, Manheim, Adesa, BCA, Autorola)
 * 3. Inspection datasets (UK MOT, TÜV, RDW, NHTSA)
 * 
 * Output: raw_sources table with raw_html, extracted_text, fetched_at, status_code
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

export interface RawSource {
  raw_source_id: string;
  source_url: string;
  source_domain: string;
  source_category: 'marketplace' | 'salvage' | 'inspection';
  raw_html: string;
  extracted_text: string;
  text_sha256: string;
  text_length: number;
  fetched_at: string;
  status_code: number;
  error?: string;
}

export class MultiSourceCollector {
  private readonly RATE_LIMIT_MS = 6000; // 10 req/min per domain
  private lastFetchTime: { [domain: string]: number } = {};

  /**
   * Marketplace sources
   */
  private readonly MARKETPLACE_URLS = [
    'https://www.autoscout24.com/lst',
    'https://www.mobile.de',
    'https://motors.ebay.com',
    'https://www.facebook.com/marketplace'
  ];

  /**
   * Salvage auction sources
   */
  private readonly SALVAGE_URLS = [
    'https://www.copart.com',
    'https://www.iaai.com',
    'https://www.manheim.com',
    'https://www.adesa.com',
    'https://www.bca-europe.com',
    'https://www.autorola.com'
  ];

  /**
   * Inspection dataset sources
   */
  private readonly INSPECTION_URLS = [
    'https://www.mot-history.org.uk',
    'https://www.tuv.com',
    'https://www.rdw.nl',
    'https://www.nhtsa.gov/complaints'
  ];

  /**
   * Rate limit by domain
   */
  private async rateLimit(domain: string): Promise<void> {
    const lastTime = this.lastFetchTime[domain] || 0;
    const elapsed = Date.now() - lastTime;
    
    if (elapsed < this.RATE_LIMIT_MS) {
      await new Promise(resolve => 
        setTimeout(resolve, this.RATE_LIMIT_MS - elapsed)
      );
    }
    
    this.lastFetchTime[domain] = Date.now();
  }

  /**
   * Fetch raw HTML from URL
   */
  private async fetchRaw(url: string): Promise<{ html: string; statusCode: number } | null> {
    try {
      const domain = new URL(url).hostname;
      await this.rateLimit(domain);

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'MechanicHelper-DataBot/1.0 (+http://mechanichelper.com/bot)'
        },
        maxRedirects: 5
      });

      return {
        html: response.data,
        statusCode: response.status
      };
    } catch (error) {
      console.error(`Fetch failed: ${url}`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Extract text from HTML
   */
  private extractText(html: string): string {
    try {
      const $ = cheerio.load(html);
      
      // Remove script, style, meta tags
      $('script, style, meta, noscript, link, svg').remove();
      
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
   * Collect from marketplace
   */
  async collectMarketplace(url: string): Promise<RawSource | null> {
    const raw = await this.fetchRaw(url);
    if (!raw) return null;

    const extractedText = this.extractText(raw.html);
    if (extractedText.length < 100) return null;

    const sha256 = crypto.createHash('sha256').update(extractedText).digest('hex');
    const domain = new URL(url).hostname;

    return {
      raw_source_id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_url: url,
      source_domain: domain,
      source_category: 'marketplace',
      raw_html: raw.html,
      extracted_text: extractedText,
      text_sha256: sha256,
      text_length: extractedText.length,
      fetched_at: new Date().toISOString(),
      status_code: raw.statusCode
    };
  }

  /**
   * Collect from salvage auction
   */
  async collectSalvage(url: string): Promise<RawSource | null> {
    const raw = await this.fetchRaw(url);
    if (!raw) return null;

    const extractedText = this.extractText(raw.html);
    if (extractedText.length < 100) return null;

    const sha256 = crypto.createHash('sha256').update(extractedText).digest('hex');
    const domain = new URL(url).hostname;

    return {
      raw_source_id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_url: url,
      source_domain: domain,
      source_category: 'salvage',
      raw_html: raw.html,
      extracted_text: extractedText,
      text_sha256: sha256,
      text_length: extractedText.length,
      fetched_at: new Date().toISOString(),
      status_code: raw.statusCode
    };
  }

  /**
   * Collect from inspection dataset
   */
  async collectInspection(url: string): Promise<RawSource | null> {
    const raw = await this.fetchRaw(url);
    if (!raw) return null;

    const extractedText = this.extractText(raw.html);
    if (extractedText.length < 100) return null;

    const sha256 = crypto.createHash('sha256').update(extractedText).digest('hex');
    const domain = new URL(url).hostname;

    return {
      raw_source_id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_url: url,
      source_domain: domain,
      source_category: 'inspection',
      raw_html: raw.html,
      extracted_text: extractedText,
      text_sha256: sha256,
      text_length: extractedText.length,
      fetched_at: new Date().toISOString(),
      status_code: raw.statusCode
    };
  }

  /**
   * Collect from all sources
   */
  async collectAll(count: number = 100): Promise<RawSource[]> {
    const results: RawSource[] = [];
    const allUrls = [
      ...this.MARKETPLACE_URLS,
      ...this.SALVAGE_URLS,
      ...this.INSPECTION_URLS
    ];

    let collected = 0;
    for (const url of allUrls) {
      if (collected >= count) break;

      let source: RawSource | null = null;

      if (this.MARKETPLACE_URLS.includes(url)) {
        source = await this.collectMarketplace(url);
      } else if (this.SALVAGE_URLS.includes(url)) {
        source = await this.collectSalvage(url);
      } else if (this.INSPECTION_URLS.includes(url)) {
        source = await this.collectInspection(url);
      }

      if (source) {
        results.push(source);
        collected++;
        console.log(`✅ Collected: ${source.source_domain} (${collected}/${count})`);
      }
    }

    return results;
  }
}

export default MultiSourceCollector;
