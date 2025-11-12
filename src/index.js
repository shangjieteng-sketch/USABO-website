import React from 'react';
import { createRoot } from 'react-dom/client';
import DocumentViewer from './components/DocumentViewer';

const container = document.getElementById('document-viewer-root');
if (container) {
  const root = createRoot(container);
  root.render(<DocumentViewer />);
}