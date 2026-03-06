/**
 * AutodocScraper - Real data extraction from autodoc.ro
 * 
 * Scrapes actual vehicle parts, OEM codes, and prices from autodoc.ro
 * Uses FlareSolverr to bypass Cloudflare protection
 * 
 * Data collected:
 * - Vehicle brands and models
 * - Part numbers (OEM codes from manufacturers)
 * - Part names and descriptions
 * - Prices in RON
 * - Source URLs for verification
 */

import * as cheerio from 'cheerio';

export class AutodocScraper {
  constructor(flaresolverrManager) {
    this.baseUrl = 'https://www.autodoc.ro';
    this.name = 'autodoc.ro';
    this.manager = flaresolverrManager;
    this.stats = {
      brandsFound: 0,
      modelsFound: 0,
      partsFound: 0,
      partsWithOemCode: 0,
      partsWithPrice: 0
    };
  }

  /**
   * Extract brands from catalog
   */
  async scrapeBrands(sessionId) {
    try {
      console.log(`[Autodoc] Scraping brands from ${this.baseUrl}`);

      const result = await this.manager.scrapeUrl(
        `${this.baseUrl}/`,
        sessionId
      );

      if (!result.success) {
        throw new Error('Failed to scrape brands page');
      }

      const $ = cheerio.load(result.html);
      const brands = [];

      // Try multiple selectors for brand dropdown
      const brandSelectors = [
        'select[name*="brand"] option',
        'select[name*="marca"] option',
        '.brand-selector option',
        '[data-brands] option',
        'a[data-brand]'
      ];

      for (const selector of brandSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const $el = $(el);
            const value = $el.attr('value') || $el.attr('data-brand') || $el.text();
            const text = $el.text().trim();

            if (value && value !== '' && text && text !== 'Selecteaza marca') {
              brands.push({
                value,
                name: text
              });
            }
          });
          break;
        }
      }

      // Remove duplicates
      const uniqueBrands = Array.from(
        new Map(brands.map(b => [b.value, b])).values()
      );

      this.stats.brandsFound = uniqueBrands.length;
      console.log(`[Autodoc] Found ${uniqueBrands.length} brands`);

      return uniqueBrands;
    } catch (error) {
      console.error('[Autodoc] Brand scraping failed:', error.message);
      throw error;
    }
  }

  /**
   * Extract models for a specific brand
   */
  async scrapeModels(brand, brandValue, sessionId) {
    try {
      console.log(`[Autodoc] Scraping models for brand: ${brand}`);

      const result = await this.manager.scrapeUrl(
        `${this.baseUrl}/?brand=${encodeURIComponent(brandValue)}`,
        sessionId
      );

      if (!result.success) {
        throw new Error(`Failed to scrape models for ${brand}`);
      }

      const $ = cheerio.load(result.html);
      const models = [];

      // Extract models from dropdown or list
      const modelSelectors = [
        'select[name*="model"] option',
        'select[name*="model"] option',
        '.model-selector option',
        '[data-models] option',
        'a[data-model]'
      ];

      for (const selector of modelSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, el) => {
            const $el = $(el);
            const value = $el.attr('value') || $el.attr('data-model') || $el.text();
            const text = $el.text().trim();

            if (value && value !== '' && text && text !== 'Selecteaza model') {
              models.push({
                name: text,
                value: value,
                brand: brand,
                sourceUrl: `${this.baseUrl}/?brand=${encodeURIComponent(brandValue)}&model=${encodeURIComponent(value)}`
              });
            }
          });
          break;
        }
      }

      // Remove duplicates
      const uniqueModels = Array.from(
        new Map(models.map(m => [m.value, m])).values()
      );

      this.stats.modelsFound += uniqueModels.length;
      console.log(`[Autodoc] Found ${uniqueModels.length} models for ${brand}`);

      return uniqueModels;
    } catch (error) {
      console.error(`[Autodoc] Model scraping failed for ${brand}:`, error.message);
      return [];
    }
  }

  /**
   * Search for parts matching criteria
   */
  async searchParts({ brand, model, category = null }, sessionId) {
    try {
      console.log(`[Autodoc] Searching parts for ${brand} ${model}`);

      // Build search URL
      let searchUrl = `${this.baseUrl}/search?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`;
      if (category) {
        searchUrl += `&category=${encodeURIComponent(category)}`;
      }

      const result = await this.manager.scrapeUrl(searchUrl, sessionId);

      if (!result.success) {
        console.warn(`[Autodoc] Failed to search parts for ${brand} ${model}`);
        return [];
      }

      const $ = cheerio.load(result.html);
      const parts = [];

      // Extract parts from search results
      const partSelectors = [
        '.product-item',
        '.part-item',
        '[data-product]',
        '.search-result-item'
      ];

      for (const selector of partSelectors) {
        const items = $(selector);
        if (items.length > 0) {
          items.each((i, el) => {
            const $item = $(el);

            // Extract part information
            const nameEl = $item.find('.product-name, h3, .part-title, a[data-part]').first();
            const priceEl = $item.find('.price, .product-price, [data-price]').first();
            const codeEl = $item.find('.oem-code, .part-number, [data-oem], code').first();
            const urlEl = $item.find('a[href*="/part/"]').first();

            const name = nameEl.text().trim();
            const priceText = priceEl.text().trim();
            const code = codeEl.text().trim();
            const partUrl = urlEl.attr('href') ? `${this.baseUrl}${urlEl.attr('href')}` : searchUrl;

            // Parse price (handle RON currency)
            let price = null;
            const priceMatch = priceText.match(/([0-9.,]+)/);
            if (priceMatch) {
              price = parseFloat(priceMatch[1].replace(',', '.'));
            }

            if (name && price) {
              parts.push({
                name,
                price,
                currency: 'RON',
                partNumber: code || null,
                brand,
                model,
                category: category || 'general',
                sourceUrl: partUrl,
                source: this.name,
                scrapedAt: new Date().toISOString()
              });

              this.stats.partsFound++;
              if (code) this.stats.partsWithOemCode++;
              if (price) this.stats.partsWithPrice++;
            }
          });
          break;
        }
      }

      console.log(`[Autodoc] Found ${parts.length} parts for ${brand} ${model}`);
      return parts;
    } catch (error) {
      console.error(`[Autodoc] Part search failed:`, error.message);
      return [];
    }
  }

  /**
   * Scrape complete vehicle catalog
   */
  async scrapeCatalog(sessionId) {
    try {
      console.log('[Autodoc] Starting catalog scrape...');

      // Get all brands
      const brands = await this.scrapeBrands(sessionId);

      const catalog = {
        source: this.name,
        brands: [],
        totalModels: 0,
        scrapedAt: new Date().toISOString()
      };

      // For each brand, get models
      for (const brand of brands.slice(0, 10)) { // Limit to first 10 brands for testing
        try {
          const models = await this.scrapeModels(brand.name, brand.value, sessionId);
          
          catalog.brands.push({
            name: brand.name,
            value: brand.value,
            models: models.slice(0, 5) // Limit models per brand
          });

          catalog.totalModels += models.length;

          // Delay between brand requests
          await new Promise(r => setTimeout(r, 3000));
        } catch (error) {
          console.warn(`[Autodoc] Failed to scrape models for ${brand.name}`);
        }
      }

      console.log(`[Autodoc] Catalog scrape complete: ${catalog.brands.length} brands, ${catalog.totalModels} models`);
      return catalog;
    } catch (error) {
      console.error('[Autodoc] Catalog scrape failed:', error.message);
      throw error;
    }
  }

  /**
   * Get scraping statistics
   */
  getStats() {
    return {
      source: this.name,
      ...this.stats,
      completeness: {
        partsWithOemCode: `${((this.stats.partsWithOemCode / Math.max(this.stats.partsFound, 1)) * 100).toFixed(1)}%`,
        partsWithPrice: `${((this.stats.partsWithPrice / Math.max(this.stats.partsFound, 1)) * 100).toFixed(1)}%`
      }
    };
  }
}

export default AutodocScraper;
