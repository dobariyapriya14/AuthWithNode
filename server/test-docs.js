const PDFService = require('./services/pdfService');
const ImageOptimizationService = require('./services/imageOptimizationService');

async function testBackendEngine() {
  console.log('--- Testing PDF Generation Service ---');
  try {
    const pdfBuffer = await PDFService.generateDocumentPDF({
      title: 'Automated System Integration Report',
      subtitle: 'Testing Document Generation Engine with Node.js',
      category: 'System Test',
      author: 'Antigravity AI',
      items: [
        { title: 'Setup PDF Engine', completed: true, mode: true },
        { title: 'Setup Image Optimization Engine', completed: true, mode: true },
        { title: 'Build React Native Preview Studio', completed: false, mode: false }
      ],
      sections: [
        {
          heading: 'Executive Summary',
          body: 'This PDF document was generated synchronously by the Node.js document rendering engine. It supports tables, headers, footers, and page numbers.'
        }
      ],
      watermarkText: 'TEST MODE'
    });

    console.log(`✅ PDF Generated Successfully! Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
  } catch (err) {
    console.error('❌ PDF Generation Failed:', err);
  }

  console.log('\n--- Testing Image Optimization Service ---');
  try {
    // 1x1 transparent PNG sample base64
    const sampleImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const result = await ImageOptimizationService.optimizeImage({
      imageBase64: sampleImageBase64,
      quality: 75,
      targetWidth: 600,
      targetHeight: 600,
      format: 'webp',
      watermarkText: 'Sample Watermark'
    });

    console.log('✅ Image Optimization Successful!');
    console.log('   Original Metrics:', result.originalMetrics);
    console.log('   Optimized Metrics:', result.optimizedMetrics);
  } catch (err) {
    console.error('❌ Image Optimization Failed:', err);
  }
}

testBackendEngine();
