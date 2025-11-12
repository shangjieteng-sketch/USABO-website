#\!/bin/bash

# PPT to PDF Converter Script
# Requires LibreOffice to be installed

INPUT_DIR="public/ppt"
OUTPUT_DIR="public/ppt-pdf"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Converting PPT files to PDF..."

# Loop through all PPT files
for file in "$INPUT_DIR"/*.ppt; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "Converting: $filename"
        
        # Convert using LibreOffice
        soffice --headless --convert-to pdf --outdir "$OUTPUT_DIR" "$file"
        
        if [ $? -eq 0 ]; then
            echo "✓ Converted: $filename"
        else
            echo "✗ Failed: $filename"
        fi
    fi
done

echo "Conversion complete\! PDF files are in: $OUTPUT_DIR"
echo "You can now serve these PDF files directly in your viewer."
EOF < /dev/null