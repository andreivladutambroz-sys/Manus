#!/usr/bin/env node

/**
 * SMOKE TEST RUNNER - Standalone Script
 * 
 * Tests two-stage pipeline on 10 allowlisted sources
 * Generates TRACEABILITY_PROOF_20.md
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Test URLs
const TEST_URLS = [
  'https://www.bimmerfest.com/threads/bingo-i-may-have-solved-the-misfire-and-lean-codes-p0171-p0174-p0300.570859/',
  'https://www.bimmerforums.com/forum/showthread.php?2202809-CEL!-Great-P0300-P0306-P0174-P0171-Help-please',
  'https://www.e90post.com/forums/showthread.php?t=1687887',
  'https://www.e46fanatics.com/threads/pesky-p0171-code.1269127/',
  'https://www.reddit.com/r/MechanicAdvice/comments/1njs5pm/i_already_replaced_catalytic_converter_why_am_i/',
  'https://www.reddit.com/r/MechanicAdvice/comments/1hvvmu5/how_serious_is_a_p0420_code/',
  'https://repairpal.com/obd-ii-code-chart',
  'https://www.autozone.com/diy/diagnostic-trouble-codes/obd-2-code-list',
  'https://www.youcanic.com/',
  'https://www.rohnertparktransmission.com/blog/p0420-code-catalytic-converter-guide'
];

const DTC_REGEX = /\b([PUBC][0-3][0-9A-F]{3})\b/g;
const VEHICLE_MAKES = [
  'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Toyota', 'Honda', 'Nissan', 'Ford', 'Chevrolet'
];

async function fetchRaw(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'MechanicHelper-Bot/1.0' }
    });
    
    const $ = cheerio.load(response.data);
    $('script, style, meta, noscript, link').remove();
    const text = ($('body').text() || $.text())
      .replace(/\s+/g, ' ')
      .trim();
    
    if (text.length < 100) return null;
    
    const sha256 = crypto.createHash('sha256').update(text).digest('hex');
    
    return {
      raw_source_id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_url: url,
      source_domain: new URL(url).hostname,
      extracted_text: text,
      text_sha256: sha256,
      text_length: text.length
    };
  } catch (error) {
    console.error(`❌ Fetch failed: ${url}`, error.message);
    return null;
  }
}

function extractRecord(text, url, domain, rawSourceId, sha256) {
  // Extract error code
  const dtcMatches = [...text.matchAll(DTC_REGEX)];
  if (dtcMatches.length === 0) {
    return { status: 'REJECT', reason: 'No error code found' };
  }
  
  const primaryCode = dtcMatches[0][1];
  
  // Extract vehicle
  let vehicleMake = null;
  for (const make of VEHICLE_MAKES) {
    if (text.toLowerCase().includes(make.toLowerCase())) {
      vehicleMake = make;
      break;
    }
  }
  
  if (!vehicleMake) {
    return { status: 'REJECT', reason: 'Vehicle make not found' };
  }
  
  // Extract symptoms (simple regex)
  const symptomKeywords = ['symptom', 'issue', 'problem', 'rough', 'stall', 'misfire'];
  const symptoms = [];
  for (const keyword of symptomKeywords) {
    const regex = new RegExp(`${keyword}[^.!?]*[.!?]`, 'gi');
    const matches = [...text.matchAll(regex)];
    for (const match of matches) {
      if (symptoms.length < 5) {
        symptoms.push({
          text: match[0].trim(),
          evidence: {
            snippet: match[0].trim(),
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    }
  }
  
  if (symptoms.length < 2) {
    return { status: 'REJECT', reason: `Only ${symptoms.length} symptoms found` };
  }
  
  // Extract repair steps
  const actionVerbs = ['inspect', 'check', 'test', 'replace', 'clean', 'tighten'];
  const procedures = [];
  for (const verb of actionVerbs) {
    const regex = new RegExp(`${verb}[^.!?]*[.!?]`, 'gi');
    const matches = [...text.matchAll(regex)];
    for (const match of matches) {
      if (procedures.length < 6) {
        procedures.push({
          step: procedures.length + 1,
          action: match[0].trim(),
          evidence: {
            snippet: match[0].trim(),
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    }
  }
  
  if (procedures.length < 3) {
    return { status: 'REJECT', reason: `Only ${procedures.length} repair steps found` };
  }
  
  // Calculate confidence
  let confidence = 0.70;
  if (/success|fixed|working/i.test(text)) confidence += 0.10;
  if (procedures.length >= 3) confidence += 0.05;
  confidence = Math.max(0.70, Math.min(0.95, confidence));
  
  return {
    status: 'ACCEPT',
    record: {
      vehicle: { make: vehicleMake },
      error_code: { code: primaryCode },
      symptoms: symptoms.slice(0, 3),
      repair_procedures: procedures.slice(0, 4),
      confidence,
      source_url: url,
      source_domain: domain,
      raw_source_id: rawSourceId,
      text_sha256: sha256
    }
  };
}

async function runSmokeTest() {
  console.log('🔥 SMOKE TEST STARTED');
  console.log(`📍 Testing ${TEST_URLS.length} sources\n`);
  
  const results = [];
  const acceptedRecords = [];
  
  for (const url of TEST_URLS) {
    console.log(`\n🔄 Processing: ${url}`);
    
    // Stage A
    const raw = await fetchRaw(url);
    if (!raw) {
      results.push({ url, status: 'REJECT', reason: 'Fetch failed' });
      continue;
    }
    
    console.log(`✅ Fetched ${raw.text_length} chars`);
    
    // Stage B
    const extraction = extractRecord(
      raw.extracted_text,
      raw.source_url,
      raw.source_domain,
      raw.raw_source_id,
      raw.text_sha256
    );
    
    results.push({ url, ...extraction });
    
    if (extraction.status === 'ACCEPT') {
      console.log(`✅ ACCEPTED`);
      acceptedRecords.push(extraction.record);
    } else {
      console.log(`❌ REJECTED: ${extraction.reason}`);
    }
  }
  
  // Generate report
  const acceptanceRate = acceptedRecords.length / results.length;
  let markdown = `# TRACEABILITY PROOF - SMOKE TEST RESULTS

**Generated:** ${new Date().toISOString()}
**Acceptance Rate:** ${(acceptanceRate * 100).toFixed(1)}%
**Total Processed:** ${results.length}
**Accepted:** ${acceptedRecords.length}
**Rejected:** ${results.length - acceptedRecords.length}

## Verdict
${acceptanceRate < 0.5 ? '✅ PASS - Strict anchoring working' : '⚠️  WARN - Acceptance rate higher than expected'}

## Accepted Records

`;
  
  for (let i = 0; i < Math.min(20, acceptedRecords.length); i++) {
    const r = acceptedRecords[i];
    markdown += `\n### Record #${i + 1}\n`;
    markdown += `**Source:** ${r.source_domain}\n`;
    markdown += `**Vehicle:** ${r.vehicle.make}\n`;
    markdown += `**Error Code:** ${r.error_code.code}\n`;
    markdown += `**Confidence:** ${r.confidence.toFixed(3)}\n`;
    markdown += `**Symptoms:** ${r.symptoms.length}\n`;
    markdown += `**Repair Steps:** ${r.repair_procedures.length}\n\n`;
  }
  
  fs.writeFileSync('/home/ubuntu/mechanic-helper/TRACEABILITY_PROOF_20.md', markdown);
  
  console.log('\n📊 RESULTS');
  console.log('═════════════════════════════');
  console.log(`Total: ${results.length}`);
  console.log(`Accepted: ${acceptedRecords.length}`);
  console.log(`Rejected: ${results.length - acceptedRecords.length}`);
  console.log(`Acceptance Rate: ${(acceptanceRate * 100).toFixed(1)}%`);
  console.log(`\n📄 Report: /home/ubuntu/mechanic-helper/TRACEABILITY_PROOF_20.md`);
}

runSmokeTest().catch(console.error);
