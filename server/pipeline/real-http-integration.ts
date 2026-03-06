/**
 * PHASE 1: REAL HTTP COLLECTORS INTEGRATION
 * 
 * Integrates with all 35 sources:
 * - 15 automotive forums
 * - 6 Reddit subreddits
 * - 8 OBD/DTC databases
 * - 5 automotive blogs
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';

export interface CollectedData {
  source_url: string;
  source_domain: string;
  raw_html: string;
  extracted_text: string;
  status_code: number;
  timestamp: string;
  collector_agent_id: string;
}

export class RealHTTPCollector {
  private client: AxiosInstance;
  private agentId: string;
  private readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
  ];

  constructor(agentId: string) {
    this.agentId = agentId;
    this.client = axios.create({
      timeout: 15000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive'
      }
    });
  }

  /**
   * Collect from single URL
   */
  async collectFromURL(url: string): Promise<CollectedData | null> {
    try {
      const response = await this.client.get(url, {
        headers: {
          'User-Agent': this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)]
        }
      });

      const extractedText = this.extractText(response.data);

      if (extractedText.length < 100) {
        return null;
      }

      const domain = new URL(url).hostname || 'unknown';

      return {
        source_url: url,
        source_domain: domain,
        raw_html: response.data,
        extracted_text: extractedText,
        status_code: response.status,
        timestamp: new Date().toISOString(),
        collector_agent_id: this.agentId
      };
    } catch (error) {
      console.error(`Failed to collect from ${url}:`, error);
      return null;
    }
  }

  /**
   * Extract text from HTML
   */
  private extractText(html: string): string {
    try {
      const $ = cheerio.load(html);
      $('script, style, meta, noscript, link, svg, iframe, button, nav, footer').remove();
      const text = ($('body').text() || $.text())
        .replace(/\s+/g, ' ')
        .trim();
      return text;
    } catch (error) {
      return '';
    }
  }

  /**
   * Collect from multiple URLs
   */
  async collectBatch(urls: string[]): Promise<CollectedData[]> {
    const results: CollectedData[] = [];

    for (const url of urls) {
      const data = await this.collectFromURL(url);
      if (data) {
        results.push(data);
      }
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    }

    return results;
  }
}

/**
 * Source configuration for all 35 sources
 */
export const SOURCE_URLS = {
  forums: [
    'https://www.bimmerfest.com/forums/',
    'https://www.e90post.com/forums/',
    'https://www.e46fanatics.com/forum/',
    'https://www.audizine.com/forum/',
    'https://www.vwvortex.com/forum/',
    'https://www.clublexus.com/forums/',
    'https://mbworld.org/forums/',
    'https://benzworld.org/forums/',
    'https://www.toyotanation.com/forum/',
    'https://www.honda-tech.com/forums/',
    'https://www.focusfanatics.com/forum/',
    'https://www.f150forum.com/',
    'https://subaruforester.org/vbulletin/',
    'https://www.wrxforums.com/forums/',
    'https://teslamotorsclub.com/tmc-forums/'
  ],
  reddit: [
    'https://www.reddit.com/r/MechanicAdvice/',
    'https://www.reddit.com/r/Cartalk/',
    'https://www.reddit.com/r/AskMechanics/',
    'https://www.reddit.com/r/Justrolledintotheshop/',
    'https://www.reddit.com/r/CarRepair/',
    'https://www.reddit.com/r/AutoMechanics/'
  ],
  obd: [
    'https://www.youcanic.com/guides',
    'https://www.repairpal.com/guides',
    'https://www.autozone.com/diy',
    'https://www.obd-codes.com/trouble_codes',
    'https://www.engine-codes.com/p0xxx',
    'https://troublecodes.net/p0xxx',
    'https://www.dtcdecode.com/p0xxx',
    'https://www.obd2codes.net/trouble-codes'
  ],
  blogs: [
    'https://www.ericthecarguy.com/blog',
    'https://www.humblemechanic.com/blog',
    'https://www.youcanic.com/blog',
    'https://www.carcarekiosk.com/blog',
    'https://www.haynes.com/en-US/blog'
  ]
};

export default RealHTTPCollector;
