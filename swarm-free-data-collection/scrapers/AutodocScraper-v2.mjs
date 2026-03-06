/**
 * AutodocScraper v2 - IMPROVED Real data extraction from autodoc.ro
 * 
 * Fixes:
 * 1. Better HTML selector matching for brand/model extraction
 * 2. OEM code validation (only real manufacturer codes)
 * 3. Data deduplication
 * 4. Better error handling
 */

import * as cheerio from 'cheerio';

// Known real OEM code patterns
const REAL_OEM_PATTERNS = {
  bosch: /^(0\s?\d{3}\s?\d{3}\s?\d{3}|BOSCH-\d+)$/i,
  mann: /^(MANN-[A-Z]\d{4}|[A-Z]\d{4})$/i,
  ngk: /^NGK-[A-Z0-9]{6,8}$/i,
  valeo: /^\d{8}$/,
  denso: /^\d{6}-\d{4}$/,
  lemförder: /^LEMFÖRDER-\d+$/i,
  shell: /^SHELL-\d+$/i,
  mobil: /^MOBIL-\d+$/i,
  castrol: /^CASTROL-\d+$/i,
};

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
      partsWithValidOemCode: 0,
      partsWithPrice: 0,
      duplicatesRemoved: 0
    };
    this.seenParts = new Set();
  }

  /**
   * Validate OEM code
   */
  isValidOemCode(code) {
    if (!code || code.length < 4) return false;

    // Check against known patterns
    for (const pattern of Object.values(REAL_OEM_PATTERNS)) {
      if (pattern.test(code)) {
        return true;
      }
    }

    // Generic pattern: at least 6 alphanumeric characters with mixed case or numbers
    if (code.length >= 6 && /[A-Z0-9]{6,}/.test(code)) {
      // Reject obviously fake patterns
      if (/^[A-Z]{2}\d{3}$/.test(code)) return false;
      if (/^[A-Z]{2}-[A-Z]-\d{3}$/.test(code)) return false;
      return true;
    }

    return false;
  }

  /**
   * Extract brands from homepage - IMPROVED
   */
  async scrapeBrands(sessionId) {
    try {
      console.log(`[Autodoc v2] Scraping brands from ${this.baseUrl}`);

      const result = await this.manager.scrapeUrl(this.baseUrl, sessionId);

      if (!result.success) {
        throw new Error('Failed to scrape brands page');
      }

      const $ = cheerio.load(result.html);
      const brands = [];

      // Try multiple selectors
      const brandSelectors = [
        { selector: 'select[name="brand"] option', value: 'value', text: 'text' },
        { selector: 'select.brand-select option', value: 'value', text: 'text' },
        { selector: 'select[id*="brand"] option', value: 'value', text: 'text' },
        { selector: '.brand-list .brand-item a', value: 'href', text: 'text' },
        { selector: 'a[data-brand]', value: 'data-brand', text: 'text' }
      ];

      for (const { selector, value, text } of brandSelectors) {
        const elements = $(selector);
        if (elements.length > 1) {
          elements.each((i, el) => {
            const $el = $(el);
            const val = $el.attr(value) || $el.text();
            const txt = $el.text().trim();

            // Filter out placeholders
            if (val && val !== '' && txt && txt.length > 0 &&
                !txt.toLowerCase().includes('select') &&
                !txt.toLowerCase().includes('alege')) {
              brands.push({
                value: val,
                name: txt
              });
            }
          });

          if (brands.length > 0) break;
        }
      }

      // Remove duplicates
      const uniqueBrands = Array.from(
        new Map(brands.map(b => [b.value, b])).values()
      );

      this.stats.brandsFound = uniqueBrands.length;
      console.log(`[Autodoc v2] Found ${uniqueBrands.length} brands`);

      return uniqueBrands;
    } catch (error) {
      console.error('[Autodoc v2] Brand scraping failed:', error.message);
      throw error;
    }
  }

  /**
   * Extract models for a specific brand - IMPROVED
   */
  async scrapeModels(brand, brandValue, sessionId) {
    try {
      console.log(`[Autodoc v2] Scraping models for brand: ${brand}`);

      const result = await this.manager.scrapeUrl(
        `${this.baseUrl}/?brand=${encodeURIComponent(brandValue)}`,
        sessionId
      );

      if (!result.success) {
        throw new Error(`Failed to scrape models for ${brand}`);
      }

      const $ = cheerio.load(result.html);
      const models = [];

      // Try multiple selectors
      const modelSelectors = [
        { selector: 'select[name="model"] option', value: 'value', text: 'text' },
        { selector: 'select.model-select option', value: 'value', text: 'text' },
        { selector: 'select[id*="model"] option', value: 'value', text: 'text' },
        { selector: '.model-list .model-item a', value: 'href', text: 'text' }
      ];

      for (const { selector, value, text } of modelSelectors) {
        const elements = $(selector);
        if (elements.length > 1) {
          elements.each((i, el) => {
            const $el = $(el);
            const val = $el.attr(value) || $el.text();
            const txt = $el.text().trim();

            // Filter out placeholders
            if (val && val !== '' && txt && txt.length > 0 &&
                !txt.toLowerCase().includes('select') &&
                !txt.toLowerCase().includes('alege')) {
              models.push({
                name: txt,
                value: val,
                brand: brand,
                sourceUrl: `${this.baseUrl}/?brand=${encodeURIComponent(brandValue)}&model=${encodeURIComponent(val)}`
              });
            }
          });

          if (models.length > 0) break;
        }
      }

      // Remove duplicates
      const uniqueModels = Array.from(
        new Map(models.map(m => [m.value, m])).values()
      );

      this.stats.modelsFound += uniqueModels.length;
      console.log(`[Autodoc v2] Found ${uniqueModels.length} models for ${brand}`);

      return uniqueModels;
    } catch (error) {
      console.error(`[Autodoc v2] Model scraping failed for ${brand}:`, error.message);
      return [];
    }
  }

  /**
   * Search for parts matching criteria - IMPROVED
   */
  async searchParts({ brand, model, category = null }, sessionId) {
    try {
      console.log(`[Autodoc v2] Searching parts for ${brand} ${model}`);

      // Skip if brand/model are placeholders
      if (brand === 'Select brand' || model === 'Select model' ||
          brand === 'Alege marca' || model === 'Alege model') {
        console.log(`[Autodoc v2] Skipping placeholder brand/model`);
        return [];
      }

      let searchUrl = `${this.baseUrl}/search?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`;
      if (category) {
        searchUrl += `&category=${encodeURIComponent(category)}`;
      }

      const result = await this.manager.scrapeUrl(searchUrl, sessionId);

      if (!result.success) {
        console.warn(`[Autodoc v2] Failed to search parts for ${brand} ${model}`);
        return [];
      }

      const $ = cheerio.load(result.html);
      const parts = [];

      // Extract parts from search results
      const partSelectors = [
        '.product-item',
        '.part-item',
        '[data-product-id]',
        '.search-result',
        '.part-card'
      ];

      for (const selector of partSelectors) {
        const items = $(selector);
        if (items.length > 0) {
          items.each((i, el) => {
            const $item = $(el);

            // Extract part information with better selectors
            const nameEl = $item.find('.product-name, h3, .part-name, a[data-part-name]').first();
            const priceEl = $item.find('.price, .part-price, [data-price]').first();
            const codeEl = $item.find('.oem-code, .part-code, [data-oem], code').first();
            const urlEl = $item.find('a[href*="/part/"]').first();

            const name = nameEl.text().trim();
            const priceText = priceEl.text().trim();
            const code = codeEl.text().trim();
            const partUrl = urlEl.attr('href') ? `${this.baseUrl}${urlEl.attr('href')}` : searchUrl;

            // Parse price
            let price = null;
            const priceMatch = priceText.match(/([0-9.,]+)/);
            if (priceMatch) {
              price = parseFloat(priceMatch[1].replace(',', '.'));
            }

            // Only add if has name and price
            if (name && price && price > 0) {
              // Create unique key to avoid duplicates
              const partKey = `${brand}-${model}-${code}-${price}`;
              
              if (!this.seenParts.has(partKey)) {
                this.seenParts.add(partKey);

                const part = {
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
                };

                // Validate OEM code if present
                if (code && this.isValidOemCode(code)) {
                  part.oemCodeValid = true;
                  this.stats.partsWithValidOemCode++;
                }

                parts.push(part);
                this.stats.partsFound++;
                if (code) this.stats.partsWithOemCode++;
                if (price) this.stats.partsWithPrice++;
              } else {
                this.stats.duplicatesRemoved++;
              }
            }
          });
          break;
        }
      }

      console.log(`[Autodoc v2] Found ${parts.length} unique parts for ${brand} ${model}`);
      return parts;
    } catch (error) {
      console.error(`[Autodoc v2] Part search failed:`, error.message);
      return [];
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
        partsWithValidOemCode: `${((this.stats.partsWithValidOemCode / Math.max(this.stats.partsFound, 1)) * 100).toFixed(1)}%`,
        partsWithPrice: `${((this.stats.partsWithPrice / Math.max(this.stats.partsFound, 1)) * 100).toFixed(1)}%`
      }
    };
  }
}

export default AutodocScraper;
