/**
 * VAILL Report Processing Script
 *
 * This script reads DOCX and PDF files from the source folder,
 * extracts their content, and creates structured JSON data for the website.
 *
 * Run with: node scripts/process-reports.js
 */

const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// Configuration
const SOURCE_DIR = path.join(__dirname, '../../VAILL Updates to Chris');
const OUTPUT_FILE = path.join(__dirname, '../src/data/reports.json');

// Month name to number mapping
const MONTHS = {
  'january': 1, 'jan': 1,
  'february': 2, 'feb': 2,
  'march': 3, 'mar': 3,
  'april': 4, 'apr': 4,
  'may': 5,
  'june': 6, 'jun': 6,
  'july': 7, 'jul': 7,
  'august': 8, 'aug': 8,
  'september': 9, 'sept': 9, 'sep': 9,
  'october': 10, 'oct': 10,
  'november': 11, 'nov': 11,
  'december': 12, 'dec': 12
};

// Files to exclude (not actual reports)
const EXCLUDE_FILES = [
  'Email to Chris G re_ VAILL budget',
  'DRAFT - VAILL Annual Report'
];

/**
 * Parse the filename to extract date and report type
 */
function parseFilename(filename) {
  const lower = filename.toLowerCase();

  // Check for quarterly reports
  const quarterlyMatch = lower.match(/q(\d)\s*(?:20)?(\d{2})/i) ||
                         lower.match(/quarterly.*?q(\d).*?(\d{4})/i);

  if (quarterlyMatch || lower.includes('quarterly')) {
    // Try to extract quarter and year
    let quarter, year;

    if (quarterlyMatch) {
      quarter = parseInt(quarterlyMatch[1]);
      year = parseInt(quarterlyMatch[2]);
      if (year < 100) year += 2000;
    } else {
      // Try another pattern for quarterly
      const qMatch = lower.match(/q(\d)/);
      const yearMatch = lower.match(/20(\d{2})/);
      if (qMatch) quarter = parseInt(qMatch[1]);
      if (yearMatch) year = 2000 + parseInt(yearMatch[1]);
    }

    if (quarter && year) {
      // Map quarter to first month of quarter
      const monthMap = { 1: 1, 2: 4, 3: 7, 4: 10 };
      return {
        type: 'quarterly',
        quarter,
        year,
        month: monthMap[quarter],
        sortKey: year * 100 + monthMap[quarter]
      };
    }
  }

  // Parse monthly reports
  let month = null;
  let year = null;

  // Find month
  for (const [name, num] of Object.entries(MONTHS)) {
    if (lower.includes(name)) {
      month = num;
      break;
    }
  }

  // Find year (look for 4-digit or 2-digit year)
  const yearMatch = lower.match(/20(\d{2})/) || lower.match(/(\d{2})(?=\.|$|-|_)/);
  if (yearMatch) {
    year = parseInt(yearMatch[1]);
    if (year < 100) year += 2000;
  }

  // For files without year, infer from context
  // "May VAILL Update to Chris.docx" is from May 2024
  // "VAILL April update.docx" is from April 2024
  if (month && !year) {
    // Based on file modification dates and context, these are 2024
    year = 2024;
    console.log(`   ℹ️  Inferred year 2024 for file with month ${month}`);
  }

  if (month && year) {
    return {
      type: 'monthly',
      month,
      year,
      sortKey: year * 100 + month
    };
  }

  return null;
}

/**
 * Generate a URL-friendly slug from date info
 */
function generateSlug(dateInfo) {
  if (dateInfo.type === 'quarterly') {
    return `${dateInfo.year}-q${dateInfo.quarter}`;
  }
  const monthStr = String(dateInfo.month).padStart(2, '0');
  return `${dateInfo.year}-${monthStr}`;
}

/**
 * Generate a human-readable title
 */
function generateTitle(dateInfo) {
  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (dateInfo.type === 'quarterly') {
    return `Q${dateInfo.quarter} ${dateInfo.year} Quarterly Report`;
  }
  return `${monthNames[dateInfo.month]} ${dateInfo.year} Update`;
}

/**
 * Extract text content from DOCX file
 */
async function extractDocx(filepath) {
  try {
    const result = await mammoth.convertToHtml({ path: filepath });
    return {
      html: result.value,
      text: result.value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    };
  } catch (error) {
    console.error(`Error reading DOCX ${filepath}:`, error.message);
    return { html: '', text: '' };
  }
}

/**
 * Extract text content from PDF file
 */
async function extractPdf(filepath) {
  try {
    const pdf = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filepath);
    const data = await pdf(dataBuffer);

    // Convert plain text to basic HTML paragraphs
    const html = data.text
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`)
      .join('\n');

    return {
      html,
      text: data.text
    };
  } catch (error) {
    console.error(`   ⚠️  PDF extraction failed: ${error.message}`);
    // Return placeholder - user can manually add content later
    return {
      html: '<p><em>PDF content could not be automatically extracted. Please view the original document.</em></p>',
      text: 'PDF content not available'
    };
  }
}

/**
 * Main processing function
 */
async function processReports() {
  console.log('🚀 Starting VAILL Report Processing...\n');
  console.log(`📁 Source directory: ${SOURCE_DIR}`);
  console.log(`📄 Output file: ${OUTPUT_FILE}\n`);

  // Get all files in source directory
  const files = fs.readdirSync(SOURCE_DIR);
  console.log(`Found ${files.length} files in source directory\n`);

  const reports = [];

  for (const filename of files) {
    // Skip excluded files and hidden files
    if (filename.startsWith('.')) continue;
    if (EXCLUDE_FILES.some(exc => filename.includes(exc))) {
      console.log(`⏭️  Skipping excluded file: ${filename}`);
      continue;
    }

    const filepath = path.join(SOURCE_DIR, filename);
    const ext = path.extname(filename).toLowerCase();

    // Only process DOCX and PDF files
    if (ext !== '.docx' && ext !== '.pdf') {
      console.log(`⏭️  Skipping non-document file: ${filename}`);
      continue;
    }

    // Parse the filename to get date info
    const dateInfo = parseFilename(filename);
    if (!dateInfo) {
      console.log(`⚠️  Could not parse date from: ${filename}`);
      continue;
    }

    console.log(`📖 Processing: ${filename}`);

    // Extract content based on file type
    let content;
    if (ext === '.docx') {
      content = await extractDocx(filepath);
    } else {
      content = await extractPdf(filepath);
    }

    // Create report object
    const report = {
      slug: generateSlug(dateInfo),
      title: generateTitle(dateInfo),
      type: dateInfo.type,
      year: dateInfo.year,
      month: dateInfo.month,
      quarter: dateInfo.quarter || null,
      sortKey: dateInfo.sortKey,
      sourceFile: filename,
      html: content.html,
      excerpt: content.text.substring(0, 300) + '...'
    };

    reports.push(report);
    console.log(`   ✅ ${report.title} (${report.slug})`);
  }

  // Handle duplicates: prefer DOCX over PDF for same date
  const reportMap = new Map();
  for (const report of reports) {
    const existing = reportMap.get(report.slug);
    if (!existing) {
      reportMap.set(report.slug, report);
    } else {
      // Keep the one from DOCX (which has better formatting)
      const currentIsDocx = report.sourceFile.toLowerCase().endsWith('.docx');
      const existingIsDocx = existing.sourceFile.toLowerCase().endsWith('.docx');
      if (currentIsDocx && !existingIsDocx) {
        console.log(`   🔄 Replacing PDF with DOCX for ${report.slug}`);
        reportMap.set(report.slug, report);
      }
    }
  }

  // Convert back to array and sort by date (newest first)
  const uniqueReports = Array.from(reportMap.values());
  uniqueReports.sort((a, b) => b.sortKey - a.sortKey);

  // Write output
  const output = {
    generatedAt: new Date().toISOString(),
    totalReports: uniqueReports.length,
    reports: uniqueReports
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`\n✨ Done! Processed ${uniqueReports.length} unique reports (from ${reports.length} files).`);
  console.log(`📄 Output saved to: ${OUTPUT_FILE}`);

  // Summary by year
  const byYear = {};
  for (const r of uniqueReports) {
    byYear[r.year] = (byYear[r.year] || 0) + 1;
  }
  console.log('\n📊 Reports by year:');
  for (const [year, count] of Object.entries(byYear).sort()) {
    console.log(`   ${year}: ${count} reports`);
  }
}

// Run the script
processReports().catch(console.error);
