const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// API endpoint to list PPT files from S3 and local HTML files
router.get('/api/ppt-files', async (req, res) => {
  const AWS = require('aws-sdk');
  const s3 = new AWS.S3({ region: 'us-east-1' });
  
  let files = [];
  let htmlFiles = [];
  
  // Load HTML converted files from local directory
  try {
    const htmlDir = path.join(__dirname, '..', 'public', 'ppt-html');
    const htmlFileList = fs.readdirSync(htmlDir);
    htmlFiles = htmlFileList
      .filter((f) => f.endsWith('.html'))
      .map((name) => ({
        name: name.replace('.html', '.ppt'),
        size: fs.statSync(path.join(htmlDir, name)).size,
        ext: 'html',
        htmlUrl: `/ppt-html/${encodeURIComponent(name)}`,
        viewerType: 'html'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (htmlError) {
    console.error('Error reading HTML directory:', htmlError);
  }
  
  try {
    const params = {
      Bucket: 'usabo-ppt-files',
      Prefix: 'ppt/'
    };
    
    const data = await s3.listObjectsV2(params).promise();
    files = data.Contents
      .filter((obj) => /\.(pptx|ppt|pdf|docx|xlsx)$/i.test(obj.Key))
      .map((obj) => ({
        name: obj.Key.replace('ppt/', ''),
        size: obj.Size,
        ext: path.extname(obj.Key).toLowerCase().replace(".", ""),
        s3Url: `https://usabo-ppt-files.s3.amazonaws.com/${obj.Key}`,
        viewerType: 's3'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.error('Error reading S3:', e);
    // Fallback to local files if S3 fails
    try {
      const dir = path.join(__dirname, '..', 'public', 'ppt');
      const fileList = fs.readdirSync(dir);
      files = fileList
        .filter((f) => /\.(pptx|ppt|pdf|docx|xlsx)$/i.test(f))
        .map((name) => ({
          name,
          size: fs.statSync(path.join(dir, name)).size,
          ext: path.extname(name).toLowerCase().replace(".", ""),
          s3Url: `/ppt/${encodeURIComponent(name)}`,
          viewerType: 'local'
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (localError) {
      console.error('Error reading local directory:', localError);
    }
  }
  // Combine HTML files with other files, prioritizing HTML versions
  const allFiles = [...htmlFiles, ...files.filter(f => !htmlFiles.find(h => h.name === f.name))];
  res.json({ files: allFiles });
});

// Main document viewer page
router.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Viewer - USABO</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="/css/bootstrap.min.css" rel="stylesheet">
    <link href="/css/bootstrap-icons.css" rel="stylesheet">
    <style>
        body { margin: 0; font-family: 'Open Sans', sans-serif; }
        .navbar { background: #13547a !important; }
        .navbar-brand { color: white !important; }
        .nav-link { color: white !important; }
        .file-list { max-height: 70vh; overflow-y: auto; }
        .file-item { padding: 12px; cursor: pointer; border-bottom: 1px solid #eee; }
        .file-item:hover { background: #f8f9fa; }
        .file-item.active { background: #e3f2fd; border-left: 4px solid #2196f3; }
        .viewer-iframe { width: 100%; height: 75vh; border: 1px solid #ddd; border-radius: 8px; }
    </style>
</head>
<body class="bg-gray-50">
    <nav class="navbar navbar-expand-lg">
        <div class="container">
            <a class="navbar-brand" href="/">
                <i class="bi-dna"></i>
                <span>USABO</span>
            </a>
            <div class="collapse navbar-collapse">
                <ul class="navbar-nav ms-lg-5 me-lg-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/#section_1">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/#section_3">Textbook</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid p-3">
        <div class="mb-3">
            <a href="/#section_3" class="text-blue-600 hover:underline">← Back to Textbook</a>
        </div>
        
        <h1 class="text-2xl font-bold mb-4">Document Viewer</h1>
        
        <div class="row">
            <!-- File Browser -->
            <div class="col-md-3">
                <div class="bg-white rounded shadow">
                    <div class="p-3 border-b bg-gray-50">
                        <h5 class="mb-0">Documents</h5>
                    </div>
                    <div id="file-list" class="file-list">
                        <div class="p-3 text-center">
                            <div class="spinner-border spinner-border-sm" role="status"></div>
                            <div>Loading files...</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Document Viewer -->
            <div class="col-md-9">
                <div class="bg-white rounded shadow">
                    <div class="p-3 border-b d-flex justify-content-between align-items-center">
                        <h5 id="current-file-name" class="mb-0">Select a document</h5>
                        <a id="download-link" href="#" class="btn btn-sm btn-outline-primary" style="display: none;">
                            <i class="bi-download"></i> Download
                        </a>
                    </div>
                    <div class="p-3">
                        <div id="viewer-content">
                            <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
                                <div class="text-muted">Select a document from the left panel to view</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let files = [];
        let currentFile = null;

        // Load files
        async function loadFiles() {
            try {
                const response = await fetch('/api/ppt-files');
                const data = await response.json();
                files = data.files || [];
                renderFileList();
                
                if (files.length > 0) {
                    selectFile(files[0]);
                }
            } catch (error) {
                document.getElementById('file-list').innerHTML = 
                    '<div class="p-3 text-danger">Error loading files</div>';
            }
        }

        // Render file list
        function renderFileList() {
            const fileList = document.getElementById('file-list');
            
            if (files.length === 0) {
                fileList.innerHTML = '<div class="p-3 text-muted">No files found</div>';
                return;
            }

            const html = files.map((file, index) => 
                \`<div class="file-item \${currentFile?.name === file.name ? 'active' : ''}" 
                      onclick="selectFile(\${JSON.stringify(file).replace(/"/g, '&quot;')})">
                    <div class="fw-medium">\${file.name}</div>
                    <small class="text-muted">\${formatFileSize(file.size)}</small>
                </div>\`
            ).join('');

            fileList.innerHTML = html;
        }

        // Select and display file
        function selectFile(file) {
            currentFile = file;
            document.getElementById('current-file-name').textContent = file.name;
            
            const downloadLink = document.getElementById('download-link');
            if (file.ext === 'html') {
                downloadLink.href = file.htmlUrl;
            } else {
                downloadLink.href = file.s3Url || \`/ppt/\${encodeURIComponent(file.name)}\`;
            }
            downloadLink.style.display = 'inline-block';
            
            renderFileList(); // Update active state
            displayFile(file);
        }

        // Display file using multiple viewer options
        function displayFile(file) {
            const viewerContent = document.getElementById('viewer-content');
            
            if (file.ext === 'html' && file.htmlUrl) {
                // Display HTML presentation with custom styling
                viewerContent.innerHTML = \`
                    <div class="mb-3">
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-primary btn-sm active" disabled>
                                HTML Presentation
                            </button>
                            <a href="\${file.htmlUrl}" class="btn btn-outline-primary btn-sm" target="_blank">
                                Open in New Tab
                            </a>
                        </div>
                    </div>
                    <iframe id="presentation-frame" src="\${file.htmlUrl}" 
                            class="viewer-iframe" 
                            title="\${file.name}"
                            style="background: white;"
                            onload="fixPresentationDisplay()">
                    </iframe>\`;
                return;
            }
            
            const fileUrl = file.s3Url || \`\${window.location.origin}/ppt/\${encodeURIComponent(file.name)}\`;
            
            if (file.ext === 'pdf') {
                // Use PDF.js for better PDF viewing
                viewerContent.innerHTML = \`
                    <iframe src="https://mozilla.github.io/pdf.js/web/viewer.html?file=\${encodeURIComponent(fileUrl)}" 
                            class="viewer-iframe" 
                            title="\${file.name}">
                    </iframe>\`;
            } else if (file.ext === 'ppt' || file.ext === 'pptx') {
                // Try multiple viewer options
                viewerContent.innerHTML = \`
                    <div class="mb-3">
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-outline-primary btn-sm" onclick="switchViewer('google', '\${fileUrl}', '\${file.name}')">
                                Google Docs Viewer
                            </button>
                            <button type="button" class="btn btn-outline-primary btn-sm" onclick="switchViewer('office', '\${fileUrl}', '\${file.name}')">
                                Office Online
                            </button>
                            <button type="button" class="btn btn-outline-primary btn-sm" onclick="switchViewer('download', '\${fileUrl}', '\${file.name}')">
                                Download & Open
                            </button>
                        </div>
                    </div>
                    <div id="viewer-frame-container">
                        <iframe src="https://docs.google.com/gview?url=\${encodeURIComponent(fileUrl)}&embedded=true" 
                                class="viewer-iframe" 
                                title="\${file.name}">
                        </iframe>
                    </div>\`;
            } else {
                viewerContent.innerHTML = \`
                    <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
                        <div class="text-center">
                            <i class="bi-file-earmark display-1 text-muted"></i>
                            <p class="mt-3">File type not supported for preview</p>
                            <a href="\${fileUrl}" class="btn btn-primary" download>
                                <i class="bi-download"></i> Download File
                            </a>
                        </div>
                    </div>\`;
            }
        }

        // Switch between different viewers
        function switchViewer(type, fileUrl, fileName) {
            const container = document.getElementById('viewer-frame-container');
            
            switch(type) {
                case 'google':
                    container.innerHTML = \`
                        <iframe src="https://docs.google.com/gview?url=\${encodeURIComponent(fileUrl)}&embedded=true" 
                                class="viewer-iframe" 
                                title="\${fileName}">
                        </iframe>\`;
                    break;
                case 'office':
                    const officeUrl = \`https://view.officeapps.live.com/op/embed.aspx?src=\${encodeURIComponent(fileUrl)}\`;
                    container.innerHTML = \`
                        <iframe src="\${officeUrl}" 
                                class="viewer-iframe" 
                                allowfullscreen 
                                title="\${fileName}">
                        </iframe>\`;
                    break;
                case 'download':
                    container.innerHTML = \`
                        <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
                            <div class="text-center">
                                <i class="bi-file-earmark-ppt display-1 text-primary"></i>
                                <h4 class="mt-3">\${fileName}</h4>
                                <p class="text-muted">Download the file to open in PowerPoint</p>
                                <a href="\${fileUrl}" class="btn btn-primary btn-lg" download>
                                    <i class="bi-download"></i> Download PowerPoint File
                                </a>
                            </div>
                        </div>\`;
                    break;
            }
        }

        // Fix presentation display by injecting CSS
        function fixPresentationDisplay() {
            try {
                const iframe = document.getElementById('presentation-frame');
                if (!iframe) return;
                
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (!iframeDoc) return;
                
                // Add CSS to fix the presentation layout
                const style = iframeDoc.createElement('style');
                style.textContent = \`
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 20px !important;
                        font-family: Arial, sans-serif !important;
                        transform: scale(0.8) !important;
                        transform-origin: top left !important;
                        width: 125% !important;
                    }
                    
                    /* Fix the page layout */
                    .page-dp1, .page-dp2, .page-dp3, .page-dp4 {
                        background: white !important;
                        margin: 20px auto !important;
                        border: 1px solid #ddd !important;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
                        position: relative !important;
                        display: block !important;
                        width: auto !important;
                        min-height: 500px !important;
                        page-break-after: always !important;
                    }
                    
                    /* Fix positioned elements */
                    div[style*="position:absolute"] {
                        position: relative !important;
                        margin: 10px !important;
                        display: inline-block !important;
                        vertical-align: top !important;
                    }
                    
                    /* Fix text styling */
                    p, span, div {
                        line-height: 1.4 !important;
                        margin: 5px 0 !important;
                    }
                    
                    /* Make images responsive */
                    img {
                        max-width: 100% !important;
                        height: auto !important;
                        margin: 10px !important;
                    }
                    
                    /* Fix font sizes */
                    .text-T1, .text-T2, .text-T3, .text-T4, .text-T5 {
                        font-size: 16px !important;
                    }
                    
                    /* Fix graphic elements */
                    [class*="graphic-"] {
                        margin: 10px !important;
                        display: inline-block !important;
                        vertical-align: top !important;
                    }
                \`;
                
                iframeDoc.head.appendChild(style);
            } catch (e) {
                console.log('Could not inject CSS into iframe:', e);
            }
        }

        // Format file size
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Initialize
        loadFiles();
    </script>
</body>
</html>`;
  
  res.send(html);
});

module.exports = router;