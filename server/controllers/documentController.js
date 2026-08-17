const PDFService = require('../services/pdfService');
const ImageOptimizationService = require('../services/imageOptimizationService');
const path = require('path');
const fs = require('fs');

const exportsDir = path.join(__dirname, '../exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

class DocumentController {
  static async generatePdf(req, res) {
    try {
      const docData = req.body;
      const pdfBuffer = await PDFService.generateDocumentPDF(docData);
      
      const fileName = `Document_${Date.now()}.pdf`;
      const filePath = path.join(exportsDir, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      const base64Pdf = pdfBuffer.toString('base64');

      return res.status(200).json({
        success: true,
        message: 'PDF Document generated successfully',
        fileName,
        fileSizeKB: (pdfBuffer.length / 1024).toFixed(2) + ' KB',
        downloadUrl: `/api/documents/download/${fileName}`,
        pdfBase64: `data:application/pdf;base64,${base64Pdf}`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF document',
        error: error.message
      });
    }
  }

  static async exportTaskReport(req, res) {
    try {
      const { tasks = [], author = 'User', title = 'Task Summary & Action Items Report' } = req.body;

      const completedCount = tasks.filter(t => t.completed).length;
      const pendingCount = tasks.length - completedCount;

      const docData = {
        title,
        subtitle: `Executive Overview: ${completedCount} Completed, ${pendingCount} Pending`,
        category: 'Task Management Summary',
        author,
        date: new Date().toLocaleDateString(),
        items: tasks,
        sections: [
          {
            heading: 'Summary Statistics',
            body: `Total Tasks Analyzed: ${tasks.length}. Completion Rate: ${tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%.`
          },
          {
            heading: 'Verification & Compliance Notes',
            body: 'This report was generated directly from your active sync records. All items logged offline will automatically reconcile upon internet reconnect.'
          }
        ],
        watermarkText: 'TASK REPORT',
        themeColor: '#007AFF'
      };

      const pdfBuffer = await PDFService.generateDocumentPDF(docData);
      const fileName = `Task_Report_${Date.now()}.pdf`;
      const filePath = path.join(exportsDir, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      const base64Pdf = pdfBuffer.toString('base64');

      return res.status(200).json({
        success: true,
        message: 'Task Report PDF generated successfully',
        fileName,
        fileSizeKB: (pdfBuffer.length / 1024).toFixed(2) + ' KB',
        downloadUrl: `/api/documents/download/${fileName}`,
        pdfBase64: `data:application/pdf;base64,${base64Pdf}`
      });
    } catch (error) {
      console.error('Error exporting task report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to export task report',
        error: error.message
      });
    }
  }

  static async optimizeImage(req, res) {
    try {
      const { imageBase64, quality, targetWidth, targetHeight, format, watermarkText } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          message: 'imageBase64 payload is required'
        });
      }

      const result = await ImageOptimizationService.optimizeImage({
        imageBase64,
        quality,
        targetWidth,
        targetHeight,
        format,
        watermarkText
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error optimizing image:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to optimize image',
        error: error.message
      });
    }
  }

  static downloadFile(req, res) {
    try {
      const { filename } = req.params;
      const filePath = path.join(exportsDir, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }

      return res.download(filePath, filename);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = DocumentController;
