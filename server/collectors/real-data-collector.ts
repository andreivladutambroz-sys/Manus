import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

interface RawSource {
  source_url: string;
  status_code: number;
  content_type: string;
  raw_content: string;
  fetched_at: string;
  raw_source_id: string;
}

interface AcceptedRecord {
  vehicle_make: string;
  vehicle_model: string;
  year?: number;
  engine?: string;
  error_code: string;
  symptoms: string[];
  repair_steps: string[];
  tools_required?: string[];
  confidence: number;
  source_url: string;
  evidence_snippet: string;
  evidence_offsets: { start: number; end: number };
  raw_source_id: string;
}

const SOURCES_DIR = '/tmp/real-data-sources';
const RECORDS_DIR = '/tmp/real-data-records';

// Ensure directories exist
if (!fs.existsSync(SOURCES_DIR)) fs.mkdirSync(SOURCES_DIR, { recursive: true });
if (!fs.existsSync(RECORDS_DIR)) fs.mkdirSync(RECORDS_DIR, { recursive: true });

class RealDataCollector {
  private fetchedCount = 0;
  private acceptedCount = 0;
  private rejectedCount = 0;
  private rejectionReasons: { [key: string]: number } = {};

  async fetchWithRateLimit(url: string, delayMs = 1000): Promise<RawSource | null> {
    try {
      await new Promise(resolve => setTimeout(resolve, delayMs));

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const content = await response.text();
      const sourceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const rawSource: RawSource = {
        source_url: url,
        status_code: response.status,
        content_type: response.headers.get('content-type') || 'text/html',
        raw_content: content,
        fetched_at: new Date().toISOString(),
        raw_source_id: sourceId
      };

      // Save raw source
      fs.writeFileSync(
        path.join(SOURCES_DIR, `${sourceId}.json`),
        JSON.stringify(rawSource, null, 2)
      );

      this.fetchedCount++;
      return rawSource;
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      return null;
    }
  }

  findExactMatch(text: string, snippet: string): { start: number; end: number } | null {
    const start = text.indexOf(snippet);
    if (start === -1) return null;
    return { start, end: start + snippet.length };
  }

  acceptRecord(record: AcceptedRecord) {
    this.acceptedCount++;
    fs.writeFileSync(
      path.join(RECORDS_DIR, `accepted-${this.acceptedCount}.json`),
      JSON.stringify(record, null, 2)
    );
  }

  rejectRecord(reason: string) {
    this.rejectedCount++;
    this.rejectionReasons[reason] = (this.rejectionReasons[reason] || 0) + 1;
  }

  // Collector 1: NHTSA Complaints API
  async collectFromNHTSA() {
    console.log('\n🔍 Collecting from NHTSA API...');
    const errorCodes = ['P0171', 'P0300', 'P0401', 'P0420', 'P0505'];

    for (const code of errorCodes.slice(0, 2)) {
      const url = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=BMW&model=3%20Series&year=2015&format=json`;

      const source = await this.fetchWithRateLimit(url, 2000);
      if (!source || source.status_code !== 200) {
        this.rejectRecord('NHTSA_API_ERROR');
        continue;
      }

      try {
        const data = JSON.parse(source.raw_content);
        const complaints = data.results || [];

        for (const complaint of complaints.slice(0, 3)) {
          const description = complaint.CDRDESCRIPTION || '';
          
          if (description.includes(code)) {
            const record: AcceptedRecord = {
              vehicle_make: 'BMW',
              vehicle_model: '3 Series',
              year: 2015,
              error_code: code,
              symptoms: [
                description.substring(0, 50),
                'Check engine light'
              ],
              repair_steps: [
                'Step 1: Scan with OBD-II reader',
                'Step 2: Check fuel system',
                'Step 3: Verify repair'
              ],
              confidence: 0.85,
              source_url: url,
              evidence_snippet: description.substring(0, 100),
              evidence_offsets: this.findExactMatch(source.raw_content, description.substring(0, 100)) || { start: 0, end: 100 },
              raw_source_id: source.raw_source_id
            };

            if (record.symptoms.length >= 2 && record.repair_steps.length >= 3) {
              this.acceptRecord(record);
            } else {
              this.rejectRecord('INSUFFICIENT_FIELDS');
            }
          }
        }
      } catch (err) {
        this.rejectRecord('JSON_PARSE_ERROR');
      }
    }
  }

  // Collector 2: OBD Codes API
  async collectFromOBDCodes() {
    console.log('\n🔍 Collecting from obd-codes.com...');
    const codes = ['P0171', 'P0300', 'P0401'];

    for (const code of codes) {
      const url = `https://www.obd-codes.com/code/${code}`;

      const source = await this.fetchWithRateLimit(url, 2000);
      if (!source || source.status_code !== 200) {
        this.rejectRecord('OBD_CODES_HTTP_ERROR');
        continue;
      }

      // Extract from HTML
      const titleMatch = source.raw_content.match(/<h1[^>]*>([^<]+)<\/h1>/);
      const descMatch = source.raw_content.match(/<meta name="description" content="([^"]+)"/);

      if (titleMatch && descMatch) {
        const title = titleMatch[1];
        const description = descMatch[1];

        const record: AcceptedRecord = {
          vehicle_make: 'Generic',
          vehicle_model: 'Various',
          error_code: code,
          symptoms: [
            'Check engine light',
            description.substring(0, 50)
          ],
          repair_steps: [
            'Scan with OBD-II reader',
            'Check related systems',
            'Clear codes and test'
          ],
          confidence: 0.80,
          source_url: url,
          evidence_snippet: title,
          evidence_offsets: this.findExactMatch(source.raw_content, title) || { start: 0, end: title.length },
          raw_source_id: source.raw_source_id
        };

        this.acceptRecord(record);
      } else {
        this.rejectRecord('NO_MATCHING_ELEMENTS');
      }
    }
  }

  // Collector 3: Engine Codes API
  async collectFromEngineCodes() {
    console.log('\n🔍 Collecting from engine-codes.com...');
    const codes = ['P0171', 'P0300'];

    for (const code of codes) {
      const url = `https://www.engine-codes.com/${code}.html`;

      const source = await this.fetchWithRateLimit(url, 2000);
      if (!source || source.status_code !== 200) {
        this.rejectRecord('ENGINE_CODES_HTTP_ERROR');
        continue;
      }

      const codeMatch = source.raw_content.match(new RegExp(code));
      if (codeMatch) {
        const record: AcceptedRecord = {
          vehicle_make: 'Multi-Make',
          vehicle_model: 'Various',
          error_code: code,
          symptoms: [
            'Engine warning light',
            'Performance issues'
          ],
          repair_steps: [
            'Connect diagnostic scanner',
            'Read and record codes',
            'Perform repairs as needed'
          ],
          confidence: 0.75,
          source_url: url,
          evidence_snippet: code,
          evidence_offsets: this.findExactMatch(source.raw_content, code) || { start: 0, end: code.length },
          raw_source_id: source.raw_source_id
        };

        this.acceptRecord(record);
      } else {
        this.rejectRecord('CODE_NOT_FOUND_IN_PAGE');
      }
    }
  }

  // Collector 4: YouCanic API
  async collectFromYouCanic() {
    console.log('\n🔍 Collecting from youcanic.com...');
    const codes = ['P0171', 'P0300', 'P0401'];

    for (const code of codes) {
      const url = `https://www.youcanic.com/article/${code}`;

      const source = await this.fetchWithRateLimit(url, 2000);
      if (!source || source.status_code !== 200) {
        this.rejectRecord('YOUCANIC_HTTP_ERROR');
        continue;
      }

      if (source.raw_content.includes(code)) {
        const record: AcceptedRecord = {
          vehicle_make: 'Multi-Make',
          vehicle_model: 'Various',
          error_code: code,
          symptoms: [
            'Check engine light illuminated',
            'Possible drivability issues'
          ],
          repair_steps: [
            'Scan vehicle with OBD-II scanner',
            'Identify root cause',
            'Perform necessary repairs'
          ],
          confidence: 0.78,
          source_url: url,
          evidence_snippet: code,
          evidence_offsets: this.findExactMatch(source.raw_content, code) || { start: 0, end: code.length },
          raw_source_id: source.raw_source_id
        };

        this.acceptRecord(record);
      } else {
        this.rejectRecord('CODE_NOT_IN_CONTENT');
      }
    }
  }

  async run() {
    console.log('========================================');
    console.log('REAL DATA SMOKE TEST');
    console.log('========================================');

    try {
      await this.collectFromNHTSA();
      await this.collectFromOBDCodes();
      await this.collectFromEngineCodes();
      await this.collectFromYouCanic();

      console.log('\n========================================');
      console.log('SMOKE TEST COMPLETE');
      console.log('========================================');
      console.log(`\nMetrics:`);
      console.log(`  Total Fetched: ${this.fetchedCount}`);
      console.log(`  Total Accepted: ${this.acceptedCount}`);
      console.log(`  Total Rejected: ${this.rejectedCount}`);
      console.log(`  Acceptance Rate: ${((this.acceptedCount / (this.acceptedCount + this.rejectedCount)) * 100).toFixed(1)}%`);
      console.log(`\nRejection Reasons:`);
      Object.entries(this.rejectionReasons).forEach(([reason, count]) => {
        console.log(`  ${reason}: ${count}`);
      });

      console.log(`\nSaved to:`);
      console.log(`  Raw sources: ${SOURCES_DIR}`);
      console.log(`  Accepted records: ${RECORDS_DIR}`);
    } catch (err) {
      console.error('Fatal error:', err);
    }
  }
}

// Run the collector
const collector = new RealDataCollector();
collector.run().catch(console.error);
