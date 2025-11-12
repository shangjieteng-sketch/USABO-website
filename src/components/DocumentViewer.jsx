import React, { useState, useEffect } from 'react';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';

const DocumentViewer = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch list of PPT files from the server
    fetch('/api/ppt-files')
      .then(response => response.json())
      .then(data => {
        const docs = data.files.map(file => ({
          uri: `/ppt/${file.name}`,
          fileName: file.name
        }));
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDoc(docs[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load documents');
        setLoading(false);
      });
  }, []);

  const handleDocumentSelect = (doc) => {
    setSelectedDoc(doc);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading documents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 border-r border-gray-300 overflow-y-auto">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold">Documents</h2>
        </div>
        <div className="p-2">
          {documents.map((doc, index) => (
            <div
              key={index}
              onClick={() => handleDocumentSelect(doc)}
              className={`p-3 mb-2 rounded cursor-pointer hover:bg-blue-50 ${
                selectedDoc?.uri === doc.uri ? 'bg-blue-100 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="text-sm font-medium truncate" title={doc.fileName}>
                {doc.fileName}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1">
        {selectedDoc ? (
          <div className="h-full">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold">{selectedDoc.fileName}</h3>
              <a
                href={selectedDoc.uri}
                download={selectedDoc.fileName}
                className="text-blue-600 hover:underline text-sm"
              >
                Download
              </a>
            </div>
            <div className="h-full">
              <DocViewer
                documents={[selectedDoc]}
                pluginRenderers={DocViewerRenderers}
                config={{
                  header: {
                    disableHeader: false,
                    disableFileName: false,
                    retainURLParams: false,
                  },
                }}
                style={{ height: 'calc(100vh - 80px)' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Select a document to view</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;