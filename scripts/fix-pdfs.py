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

def clean_email_headers(text):
    """Remove email forwarding headers from text"""
    import re

    # Find where the actual content starts (after email headers)
    # Look for patterns like "VAILL Activities" or "VAILL -" which start the real content
    patterns = [
        r'VAILL Activities',
        r'VAILL -',
        r'VAILL Report',
        r'Educational Initiatives',
        r'Curriculum',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            # Start from this point
            text = text[match.start():]
            break

    # Clean up common artifacts
    text = re.sub(r'From:.*?\n', '', text)
    text = re.sub(r'To:.*?\n', '', text)
    text = re.sub(r'Subject:.*?\n', '', text)
    text = re.sub(r'Date:.*?\n', '', text)
    text = re.sub(r'Sent:.*?\n', '', text)
    text = re.sub(r'Cc:.*?\n', '', text)
    text = re.sub(r'Attachments:.*?\n', '', text)
    text = re.sub(r'FYI\s*\n', '', text)
    text = re.sub(r'image\d+\.png', '', text)

    return text.strip()

def text_to_html(text):
    """Convert plain text to basic HTML"""
    # Clean email headers first
    text = clean_email_headers(text)

    # Known section headers
    section_headers = [
        'Curriculum', 'Educational Initiatives', 'Course Preparation',
        'Events', 'Speaking Engagements', 'Projects', 'Meetings',
        'Media', 'Articles', 'Research', 'Other', 'Personnel',
        'Outreach', 'Grants', 'Publications', 'Partnerships'
    ]

    lines = text.split('\n')
    html_parts = []
    current_para = []

    for line in lines:
        line = line.strip()
        if not line:
            if current_para:
                html_parts.append(f"<p>{' '.join(current_para)}</p>")
                current_para = []
            continue

        # Check if it's a section header
        is_header = False
        for header in section_headers:
            if line.lower().startswith(header.lower()) and len(line) < 100:
                if current_para:
                    html_parts.append(f"<p>{' '.join(current_para)}</p>")
                    current_para = []
                html_parts.append(f"<h2>{line}</h2>")
                is_header = True
                break

        # Check if it looks like "VAILL Activities in December 2023" style header
        if not is_header and line.startswith('VAILL') and len(line) < 80:
            if current_para:
                html_parts.append(f"<p>{' '.join(current_para)}</p>")
                current_para = []
            html_parts.append(f"<h2>{line}</h2>")
            is_header = True

        # Check if it's a bullet point
        if not is_header:
            if line.startswith(('•', '-', '●', '○', '*')):
                if current_para:
                    html_parts.append(f"<p>{' '.join(current_para)}</p>")
                    current_para = []
                bullet_text = line.lstrip('•-●○* ')
                html_parts.append(f"<li>{bullet_text}</li>")
            else:
                current_para.append(line)

    if current_para:
        html_parts.append(f"<p>{' '.join(current_para)}</p>")

    # Wrap consecutive <li> elements in <ul>
    result = []
    in_list = False
    for part in html_parts:
        if part.startswith('<li>'):
            if not in_list:
                result.append('<ul>')
                in_list = True
            result.append(part)
        else:
            if in_list:
                result.append('</ul>')
                in_list = False
            result.append(part)
    if in_list:
        result.append('</ul>')

    return "\n".join(result)

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
