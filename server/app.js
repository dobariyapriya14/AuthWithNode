let express;
let cors;
try {
  express = require('express');
  cors = require('cors');
} catch (e) {
  console.log('Express/Cors modules loading fallback mode');
}

const path = require('path');
const fs = require('fs');
const documentRoutes = require('./routes/documentRoutes');

const PORT = process.env.PORT || 3000;

if (express && cors) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static Exports Directory
  app.use('/exports', express.static(path.join(__dirname, 'exports')));

  // API Routes
  app.use('/api/documents', documentRoutes);

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'Document & Image Optimization Engine' });
  });

  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`🚀 Document & Image Processing Node Server running on http://localhost:${PORT}`);
    });
  }

  module.exports = app;
} else {
  // Pure Node Native HTTP Server Fallback
  const http = require('http');
  const PDFService = require('./services/pdfService');
  const ImageOptimizationService = require('./services/imageOptimizationService');

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      let parsed = {};
      try { parsed = JSON.parse(body || '{}'); } catch (e) {}

      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'OK', mode: 'Native Node HTTP Fallback' }));
      }

      if (req.url === '/api/documents/generate-pdf' && req.method === 'POST') {
        try {
          const pdfBuffer = await PDFService.generateDocumentPDF(parsed);
          const base64Pdf = pdfBuffer.toString('base64');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            message: 'PDF Document generated successfully',
            fileName: `Document_${Date.now()}.pdf`,
            fileSizeKB: (pdfBuffer.length / 1024).toFixed(2) + ' KB',
            pdfBase64: `data:application/pdf;base64,${base64Pdf}`
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: err.message }));
        }
      }

      if (req.url === '/api/documents/optimize-image' && req.method === 'POST') {
        try {
          const result = await ImageOptimizationService.optimizeImage(parsed);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: err.message }));
        }
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Not found' }));
    });
  });

  if (require.main === module) {
    server.listen(PORT, () => {
      console.log(`🚀 Document & Image Processing Node HTTP Fallback Server running on http://localhost:${PORT}`);
    });
  }

  module.exports = server;
}
