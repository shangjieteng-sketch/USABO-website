#!/bin/bash

# Script to convert PowerPoint files to PDF using LibreOffice
# Make sure LibreOffice is installed: brew install --cask libreoffice

PPT_DIR="/Users/a2021625/Desktop/USABO-website/public/ppt"
PDF_DIR="/Users/a2021625/Desktop/USABO-website/public/pdf"

# Create PDF directory if it doesn't exist
mkdir -p "$PDF_DIR"

echo "Converting PowerPoint files to PDF..."
echo "PPT Directory: $PPT_DIR"
echo "PDF Directory: $PDF_DIR"

# Check if LibreOffice is available
if command -v soffice &> /dev/null; then
    SOFFICE_CMD="soffice"
elif [ -f "/Applications/LibreOffice.app/Contents/MacOS/soffice" ]; then
    SOFFICE_CMD="/Applications/LibreOffice.app/Contents/MacOS/soffice"
else
    echo "LibreOffice not found. Please install it first:"
    echo "brew install --cask libreoffice"
    exit 1
fi

# Convert first 3 chapters for demonstration
count=0
for file in "$PPT_DIR"/*.ppt; do
    if [ $count -ge 3 ]; then
        break
    fi
    
    filename=$(basename "$file")
    echo "Converting: $filename"
    
    # Convert to PDF
    "$SOFFICE_CMD" --headless --convert-to pdf --outdir "$PDF_DIR" "$file"
    
    if [ $? -eq 0 ]; then
        echo "✓ Successfully converted: $filename"
    else
        echo "✗ Failed to convert: $filename"
    fi
    
    ((count++))
done

echo "Conversion completed! Check the $PDF_DIR directory."
echo "Converted $count files for demonstration."