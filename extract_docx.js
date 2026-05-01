const fs = require('fs');
const path = require('path');

// Simple docx text extractor using built-in modules
const { execSync } = require('child_process');

// Use adm-zip if available, otherwise use a manual approach
try {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip('e:\\project\\virtual-herbal-garden\\VirtualTour_PRD_v1.docx');
  const entry = zip.getEntry('word/document.xml');
  const xml = entry.getData().toString('utf8');
  
  // Extract paragraphs
  const paragraphs = xml.match(/<w:p[ >][^]*?<\/w:p>/g) || [];
  const lines = paragraphs.map(p => {
    const texts = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(m => m[1]);
    return texts.join('');
  });
  
  console.log(lines.filter(l => l.trim()).join('\n'));
} catch(e) {
  // Fallback: use zlib manually
  const { createReadStream } = require('fs');
  const { createUnzip } = require('zlib');
  
  console.error('adm-zip not found, trying alternative...');
  console.error(e.message);
}
