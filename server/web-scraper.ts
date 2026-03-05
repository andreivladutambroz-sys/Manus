import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedDiagnosticInfo {
  source: string;
  url: string;
  title: string;
  content: string;
  relevance: number; // 0-1
  date?: string;
  author?: string;
}

export interface DiagnosticContext {
  brand: string;
  model: string;
  year?: number;
  symptoms: string[];
  errorCodes?: string[];
}

class WebScraper {
  private readonly headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  async scrapeReddit(context: DiagnosticContext): Promise<ScrapedDiagnosticInfo[]> {
    try {
      const query = this.buildRedditQuery(context);
      const url = `https://www.reddit.com/r/MechanicAdvice/search?q=${encodeURIComponent(query)}&sort=relevance&t=all`;
      
      const response = await axios.get(url, { headers: this.headers, timeout: 5000 });
      const $ = cheerio.load(response.data);
      
      const results: ScrapedDiagnosticInfo[] = [];
      
      $('div[data-testid="post-container"]').each((_: number, element: any) => {
        const title = $(element).find('h3').text();
        const link = $(element).find('a[data-testid="internal-unauthenticated-comment-link"]').attr('href');
        const content = $(element).find('div[data-testid="post-text"]').text();
        
        if (title && link) {
          results.push({
            source: 'Reddit - r/MechanicAdvice',
            url: `https://reddit.com${link}`,
            title,
            content: content || title,
            relevance: this.calculateRelevance(title + ' ' + content, context),
            date: new Date().toISOString(),
          });
        }
      });
      
      return results.filter(r => r.relevance > 0.3).sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('Reddit scraping error:', error);
      return [];
    }
  }

  async scrapeBenzWorld(context: DiagnosticContext): Promise<ScrapedDiagnosticInfo[]> {
    if (context.brand.toLowerCase() !== 'mercedes-benz') {
      return [];
    }

    try {
      const query = this.buildForumQuery(context);
      const url = `https://www.benzworld.org/forums/search/?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(url, { headers: this.headers, timeout: 5000 });
      const $ = cheerio.load(response.data);
      
      const results: ScrapedDiagnosticInfo[] = [];
      
      $('div.ipsDataItem').each((_: number, element: any) => {
        const title = $(element).find('h3 a').text();
        const link = $(element).find('h3 a').attr('href');
        const excerpt = $(element).find('p.ipsType_normal').text();
        
        if (title && link) {
          results.push({
            source: 'BenzWorld Forums',
            url: link,
            title,
            content: excerpt || title,
            relevance: this.calculateRelevance(title + ' ' + excerpt, context),
          });
        }
      });
      
      return results.filter(r => r.relevance > 0.3).sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('BenzWorld scraping error:', error);
      return [];
    }
  }

  async scrapeYouTube(context: DiagnosticContext): Promise<ScrapedDiagnosticInfo[]> {
    try {
      const query = this.buildYouTubeQuery(context);
      // Note: YouTube requires special handling. This is a simplified version.
      // In production, use YouTube Data API v3
      
      const results: ScrapedDiagnosticInfo[] = [];
      
      // Placeholder for YouTube API integration
      results.push({
        source: 'YouTube',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        title: `${context.brand} ${context.model} diagnostic videos`,
        content: `Search results for ${query}`,
        relevance: 0.7,
      });
      
      return results;
    } catch (error) {
      console.error('YouTube scraping error:', error);
      return [];
    }
  }

  async scrapeCarGurus(context: DiagnosticContext): Promise<ScrapedDiagnosticInfo[]> {
    try {
      const query = this.buildCarGurusQuery(context);
      const url = `https://www.cargurus.com/Cars/t-${encodeURIComponent(query)}`;
      
      const response = await axios.get(url, { headers: this.headers, timeout: 5000 });
      const $ = cheerio.load(response.data);
      
      const results: ScrapedDiagnosticInfo[] = [];
      
      $('div.discussion-item').each((_: number, element: any) => {
        const title = $(element).find('h2').text();
        const link = $(element).find('a').attr('href');
        const content = $(element).find('p').text();
        
        if (title && link) {
          results.push({
            source: 'CarGurus',
            url: link,
            title,
            content: content || title,
            relevance: this.calculateRelevance(title + ' ' + content, context),
          });
        }
      });
      
      return results.filter(r => r.relevance > 0.3).sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('CarGurus scraping error:', error);
      return [];
    }
  }

  private buildRedditQuery(context: DiagnosticContext): string {
    const parts = [
      context.brand,
      context.model,
      ...context.symptoms.slice(0, 2),
    ];
    return parts.join(' ');
  }

  private buildForumQuery(context: DiagnosticContext): string {
    const parts = [
      context.brand,
      context.model,
      ...context.symptoms.slice(0, 2),
    ];
    return parts.join(' ');
  }

  private buildYouTubeQuery(context: DiagnosticContext): string {
    return `${context.brand} ${context.model} diagnostic ${context.symptoms[0] || ''}`;
  }

  private buildCarGurusQuery(context: DiagnosticContext): string {
    return `${context.brand}-${context.model}-${context.symptoms[0] || 'diagnostic'}`;
  }

  private calculateRelevance(text: string, context: DiagnosticContext): number {
    let score = 0;
    const lowerText = text.toLowerCase();
    
    // Brand match
    if (lowerText.includes(context.brand.toLowerCase())) score += 0.3;
    
    // Model match
    if (lowerText.includes(context.model.toLowerCase())) score += 0.3;
    
    // Symptom matches
    context.symptoms.forEach(symptom => {
      if (lowerText.includes(symptom.toLowerCase())) score += 0.15;
    });
    
    // Error code matches
    context.errorCodes?.forEach(code => {
      if (lowerText.includes(code)) score += 0.1;
    });
    
    return Math.min(score, 1);
  }

  async aggregateSources(context: DiagnosticContext): Promise<ScrapedDiagnosticInfo[]> {
    const [reddit, benzworld, youtube, cargurus] = await Promise.all([
      this.scrapeReddit(context),
      this.scrapeBenzWorld(context),
      this.scrapeYouTube(context),
      this.scrapeCarGurus(context),
    ]);

    const allResults = [...reddit, ...benzworld, ...youtube, ...cargurus];
    return allResults.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
  }
}

export const webScraper = new WebScraper();
