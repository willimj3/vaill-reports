#!/bin/bash
# VAILL Report Processing Script
# Run this after adding new DOCX files to the "VAILL Updates to Chris" folder

echo "Processing VAILL reports..."
cd "$(dirname "$0")/.."

# Process reports
node scripts/process-reports.js

# Rebuild the site
echo ""
echo "Rebuilding site..."
npm run build

echo ""
echo "Done! Your new reports have been processed."
echo "To preview: npm run dev"
echo "To deploy: vercel --prod"
