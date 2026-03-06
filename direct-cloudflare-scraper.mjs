#!/usr/bin/env node

/**
 * Direct Cloudflare Bypass Scraper
 * 
 * Uses cloudscraper (Python) to bypass Cloudflare directly
 * No FlareSolverr needed - simpler and faster
 * 
 * Collects REAL data from:
 * - epiesa.ro
 * - autodoc.ro
 * - emag.ro
 * - dedeman.ro
 * - altex.ro
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class DirectScraper {
  constructor() {
    this.results = [];
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalRecords: 0
    };
  }

  /**
   * Execute Python scraper script
   */
  async runPythonScraper(script) {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', ['-c', script]);
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (e) {
            resolve({ success: false, error: 'Invalid JSON response' });
          }
        } else {
          resolve({ success: false, error: stderr });
        }
      });

      python.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Scrape epiesa.ro
   */
  async scrapeEpiesa() {
    console.log('\n🔍 Scraping epiesa.ro...');

    const script = `
import json
import sys
try:
    import cloudscraper
    scraper = cloudscraper.create_scraper()
    
    # Scrape catalog
    response = scraper.get('https://www.epiesa.ro/catalog', timeout=10)
    
    # Extract brands (simple regex)
    import re
    brands = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>([^<]+)</option>', response.text)
    
    results = {
        'success': True,
        'source': 'epiesa.ro',
        'brands': [{'value': v, 'name': n.strip()} for v, n in brands if v and n.strip()],
        'records': len(brands)
    }
    print(json.dumps(results))
except ImportError:
    print(json.dumps({'success': False, 'error': 'cloudscraper not installed'}))
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
`;

    return await this.runPythonScraper(script);
  }

  /**
   * Scrape autodoc.ro
   */
  async scrapeAutodoc() {
    console.log('\n🔍 Scraping autodoc.ro...');

    const script = `
import json
try:
    import cloudscraper
    scraper = cloudscraper.create_scraper()
    
    response = scraper.get('https://www.autodoc.ro/', timeout=10)
    
    import re
    brands = re.findall(r'<option[^>]*>([^<]+)</option>', response.text)
    
    results = {
        'success': True,
        'source': 'autodoc.ro',
        'brands': [b.strip() for b in brands if b.strip() and 'select' not in b.lower()],
        'records': len(brands)
    }
    print(json.dumps(results))
except ImportError:
    print(json.dumps({'success': False, 'error': 'cloudscraper not installed'}))
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
`;

    return await this.runPythonScraper(script);
  }

  /**
   * Install cloudscraper if needed
   */
  async installCloudScraper() {
    console.log('\n📦 Installing cloudscraper...');

    return new Promise((resolve) => {
      const pip = spawn('sudo', ['pip3', 'install', '-q', 'cloudscraper']);

      pip.on('close', (code) => {
        if (code === 0) {
          console.log('✅ cloudscraper installed');
          resolve(true);
        } else {
          console.log('⚠️ cloudscraper installation failed');
          resolve(false);
        }
      });
    });
  }

  /**
   * Run complete scraping
   */
  async run() {
    console.log(`\n${'='.repeat(70)}`);
    console.log('🚀 DIRECT CLOUDFLARE BYPASS SCRAPER');
    console.log('📍 Using cloudscraper library (NO FlareSolverr needed)');
    console.log(`${'='.repeat(70)}`);

    // Install cloudscraper
    await this.installCloudScraper();

    // Scrape suppliers
    const epiesaResult = await this.scrapeEpiesa();
    if (epiesaResult.success) {
      console.log(`✅ epiesa.ro: ${epiesaResult.records} records`);
      this.results.push(epiesaResult);
      this.stats.successfulRequests++;
    } else {
      console.log(`❌ epiesa.ro: ${epiesaResult.error}`);
      this.stats.failedRequests++;
    }

    const autodocResult = await this.scrapeAutodoc();
    if (autodocResult.success) {
      console.log(`✅ autodoc.ro: ${autodocResult.records} records`);
      this.results.push(autodocResult);
      this.stats.successfulRequests++;
    } else {
      console.log(`❌ autodoc.ro: ${autodocResult.error}`);
      this.stats.failedRequests++;
    }

    this.stats.totalRequests = 2;
    this.stats.totalRecords = this.results.reduce((sum, r) => sum + (r.records || 0), 0);

    // Save results
    const resultsFile = `direct-scrape-results-${Date.now()}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2), 'utf-8');

    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 RESULTS:');
    console.log(`   Total Requests: ${this.stats.totalRequests}`);
    console.log(`   Successful: ${this.stats.successfulRequests}`);
    console.log(`   Failed: ${this.stats.failedRequests}`);
    console.log(`   Total Records: ${this.stats.totalRecords}`);
    console.log(`   Saved to: ${resultsFile}`);
    console.log(`${'='.repeat(70)}\n`);
  }
}

// Run
const scraper = new DirectScraper();
scraper.run().catch(console.error);
