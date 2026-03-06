/**
 * TWO-STAGE PIPELINE ORCHESTRATOR
 * 
 * STAGE A: Raw collection (no records)
 * STAGE B: Strict extraction (anchored evidence only)
 * 
 * NO fabrication. NO paraphrasing. NO template steps.
 */

import StageARawCollector, { RawSource } from './stage-a-raw-collector';
import StageBStrictExtractor from './stage-b-strict-extractor';

export interface PipelineResult {
  raw_source_id: string;
  source_url: string;
  extraction_status: 'ACCEPT' | 'REJECT';
  record?: any;
  rejection_reason?: string;
  raw_text_length: number;
  extraction_timestamp: string;
}

export class TwoStagePipeline {
  private collector = new StageARawCollector();
  private extractor = new StageBStrictExtractor();
  private results: PipelineResult[] = [];

  /**
   * Process single URL through both stages
   */
  async processUrl(url: string): Promise<PipelineResult> {
    console.log(`\n🔄 Processing: ${url}`);

    // STAGE A: Fetch raw data
    console.log(`📥 STAGE A: Fetching raw data...`);
    const rawSource = await this.collector.fetchRawSource(url);
    
    if (!rawSource) {
      return {
        raw_source_id: `failed-${Date.now()}`,
        source_url: url,
        extraction_status: 'REJECT',
        rejection_reason: 'Failed to fetch URL',
        raw_text_length: 0,
        extraction_timestamp: new Date().toISOString()
      };
    }

    console.log(`✅ STAGE A: Extracted ${rawSource.text_length} chars`);

    // STAGE B: Extract with strict anchoring
    console.log(`🔍 STAGE B: Extracting with strict anchoring...`);
    const extractionResult = await this.extractor.extractRecord(
      rawSource.extracted_text,
      rawSource.source_url,
      rawSource.source_domain,
      rawSource.raw_source_id,
      rawSource.text_sha256
    );

    const result: PipelineResult = {
      raw_source_id: rawSource.raw_source_id,
      source_url: url,
      extraction_status: extractionResult.status,
      record: extractionResult.record,
      rejection_reason: extractionResult.reason,
      raw_text_length: rawSource.text_length,
      extraction_timestamp: new Date().toISOString()
    };

    if (extractionResult.status === 'ACCEPT') {
      console.log(`✅ STAGE B: ACCEPTED`);
    } else {
      console.log(`❌ STAGE B: REJECTED - ${extractionResult.reason}`);
    }

    this.results.push(result);
    return result;
  }

  /**
   * Process multiple URLs
   */
  async processUrls(urls: string[]): Promise<PipelineResult[]> {
    this.results = [];
    
    for (const url of urls) {
      await this.processUrl(url);
    }
    
    return this.results;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const accepted = this.results.filter(r => r.extraction_status === 'ACCEPT');
    const rejected = this.results.filter(r => r.extraction_status === 'REJECT');

    return {
      total_processed: this.results.length,
      accepted_count: accepted.length,
      rejected_count: rejected.length,
      acceptance_rate: accepted.length / this.results.length,
      rejection_reasons: this.getRejectionReasons(),
      average_text_length: Math.round(
        this.results.reduce((sum, r) => sum + r.raw_text_length, 0) / this.results.length
      )
    };
  }

  /**
   * Get rejection reasons
   */
  private getRejectionReasons(): { [key: string]: number } {
    const reasons: { [key: string]: number } = {};
    
    for (const result of this.results) {
      if (result.rejection_reason) {
        reasons[result.rejection_reason] = (reasons[result.rejection_reason] || 0) + 1;
      }
    }
    
    return reasons;
  }

  /**
   * Get accepted records
   */
  getAcceptedRecords() {
    return this.results
      .filter(r => r.extraction_status === 'ACCEPT')
      .map(r => r.record);
  }

  /**
   * Export results
   */
  exportResults() {
    return {
      timestamp: new Date().toISOString(),
      statistics: this.getStatistics(),
      results: this.results,
      accepted_records: this.getAcceptedRecords()
    };
  }
}

export default TwoStagePipeline;
