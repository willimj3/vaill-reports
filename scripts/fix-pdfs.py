#!/usr/bin/env python3
"""
Fix PDF extraction for problematic reports
"""

import json
from pathlib import Path
from pypdf import PdfReader

# Paths
SOURCE_DIR = Path(__file__).parent.parent.parent / "VAILL Updates to Chris"
REPORTS_FILE = Path(__file__).parent.parent / "src/data/reports.json"

# PDFs to extract
PDF_FILES = {
    "2023-11": "FW_ VAILL - November 2023 update.pdf",
    "2023-12": "FW_ VAILL Report for December 2023 .pdf",
    "2024-01": "FW_ VAILL Report January 2024.pdf",
}

def extract_pdf_text(pdf_path):
    """Extract text from PDF using pypdf"""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n\n"
    return text.strip()

def text_to_html(text):
    """Convert plain text to basic HTML"""
    paragraphs = text.split('\n\n')
    html_parts = []
    for p in paragraphs:
        p = p.strip()
        if p:
            # Check if it looks like a heading (short, no period at end)
            if len(p) < 80 and not p.endswith('.') and not p.endswith(':'):
                html_parts.append(f"<h2>{p}</h2>")
            else:
                html_parts.append(f"<p>{p}</p>")
    return "\n".join(html_parts)

def main():
    # Load existing reports
    with open(REPORTS_FILE) as f:
        data = json.load(f)

    print(f"Loaded {len(data['reports'])} reports")

    # Fix each problematic PDF
    for slug, filename in PDF_FILES.items():
        pdf_path = SOURCE_DIR / filename
        if not pdf_path.exists():
            print(f"WARNING: {filename} not found")
            continue

        print(f"\nProcessing {filename}...")

        # Extract text
        text = extract_pdf_text(pdf_path)
        print(f"  Extracted {len(text)} characters")

        # Convert to HTML
        html = text_to_html(text)

        # Find and update the report
        for report in data['reports']:
            if report['slug'] == slug:
                report['html'] = html
                report['excerpt'] = text[:300] + "..."
                print(f"  Updated {report['title']}")
                break

    # Save updated reports
    with open(REPORTS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"\nSaved updated reports to {REPORTS_FILE}")

if __name__ == "__main__":
    main()
