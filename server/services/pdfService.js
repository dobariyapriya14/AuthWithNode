const { Buffer } = require('buffer');

let PDFDocument = null;
try {
  PDFDocument = require('pdfkit');
} catch (e) {
  console.log('PDFKit not installed yet, using resilient fallback generator');
}

/**
 * PDF Service for dynamic document generation and export
 */
class PDFService {
  /**
   * Generates a PDF buffer from a custom document model
   * @param {Object} docData 
   * @returns {Promise<Buffer>}
   */
  static generateDocumentPDF(docData = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (PDFDocument) {
          const doc = new PDFDocument({ margin: 40, size: 'A4' });
          const buffers = [];

          doc.on('data', buffers.push.bind(buffers));
          doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
          });

          const {
            title = 'Document Report',
            subtitle = 'Generated via Node.js Document Engine',
            category = 'General Document',
            author = 'System User',
            date = new Date().toLocaleDateString(),
            sections = [],
            items = [],
            signatureBase64 = null,
            watermarkText = 'CONFIDENTIAL',
            themeColor = '#6200EE'
          } = docData;

          // Top accent bar
          doc.save();
          doc.fillColor(themeColor);
          doc.rect(0, 0, doc.page.width, 12).fill();
          doc.restore();

          // Header Section
          doc.fillColor(themeColor)
             .fontSize(24)
             .font('Helvetica-Bold')
             .text(title, 40, 40);

          doc.fillColor('#555555')
             .fontSize(12)
             .font('Helvetica')
             .text(subtitle, 40, 70);

          // Metadata Line
          doc.moveDown(0.8);
          doc.strokeColor('#E0E0E0').lineWidth(1)
             .moveTo(40, 95).lineTo(doc.page.width - 40, 95).stroke();

          doc.fontSize(10).fillColor('#777777')
             .text(`Category: ${category}   |   Author: ${author}   |   Date: ${date}`, 40, 105);

          doc.strokeColor('#E0E0E0').lineWidth(1)
             .moveTo(40, 125).lineTo(doc.page.width - 40, 125).stroke();

          let currentY = 145;

          // Items Table / List
          if (items && items.length > 0) {
            doc.fontSize(14).fillColor(themeColor).font('Helvetica-Bold')
               .text('Document Line Items / Tasks', 40, currentY);
            currentY += 25;

            // Table Header
            doc.fillColor('#F5F5F5')
               .rect(40, currentY, doc.page.width - 80, 22).fill();
            
            doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold')
               .text('#', 50, currentY + 6)
               .text('Title / Description', 90, currentY + 6)
               .text('Status', doc.page.width - 160, currentY + 6)
               .text('Priority / Mode', doc.page.width - 90, currentY + 6);

            currentY += 24;

            items.forEach((item, index) => {
              if (currentY > doc.page.height - 100) {
                doc.addPage();
                currentY = 40;
              }

              const isEven = index % 2 === 0;
              if (isEven) {
                doc.fillColor('#FAFAFA')
                   .rect(40, currentY, doc.page.width - 80, 20).fill();
              }

              doc.fillColor('#333333').fontSize(9).font('Helvetica')
                 .text(`${index + 1}`, 50, currentY + 5)
                 .text(item.title || item.name || 'Item', 90, currentY + 5, { width: 250, height: 15, ellipsis: true })
                 .text(item.completed ? 'COMPLETED' : 'PENDING', doc.page.width - 160, currentY + 5)
                 .text(item.mode ? 'ONLINE' : 'OFFLINE', doc.page.width - 90, currentY + 5);

              currentY += 22;
            });

            currentY += 15;
          }

          // Content Sections
          if (sections && sections.length > 0) {
            sections.forEach((sec) => {
              if (currentY > doc.page.height - 100) {
                doc.addPage();
                currentY = 40;
              }

              doc.fontSize(12).fillColor(themeColor).font('Helvetica-Bold')
                 .text(sec.heading || 'Notes', 40, currentY);
              currentY += 18;

              doc.fontSize(10).fillColor('#444444').font('Helvetica')
                 .text(sec.body || '', 40, currentY, { width: doc.page.width - 80 });
              
              currentY += (sec.body ? Math.ceil(sec.body.length / 80) * 14 + 15 : 25);
            });
          }

          // Digital Signature block if attached
          if (signatureBase64) {
            if (currentY > doc.page.height - 120) {
              doc.addPage();
              currentY = 40;
            }

            doc.moveDown();
            doc.fontSize(11).fillColor(themeColor).font('Helvetica-Bold')
               .text('Verified Digital Signature:', 40, currentY);
            currentY += 18;

            try {
              const cleanBase64 = signatureBase64.replace(/^data:image\/\w+;base64,/, '');
              const imgBuffer = Buffer.from(cleanBase64, 'base64');
              doc.image(imgBuffer, 40, currentY, { width: 160, height: 60 });
              currentY += 65;
            } catch (e) {
              doc.fontSize(9).fillColor('#D32F2F').text('[Signature Image Attached]', 40, currentY);
              currentY += 20;
            }
          }

          // Footer
          const pageCount = doc.bufferedPageRange().count || 1;
          for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor('#999999')
               .text(
                 `Page ${i + 1} of ${pageCount}  •  Node.js Document & PDF Engine  •  Confidential`,
                 40,
                 doc.page.height - 30,
                 { align: 'center', width: doc.page.width - 80 }
               );
          }

          doc.end();
        } else {
          // Pure Node Minimal PDF Header Fallback Stream
          const title = docData.title || 'Document Report';
          const pdfHeader = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 120 >>\nstream\nBT /F1 24 Tf 40 750 Td (${title}) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000223 00000 n \n0000000302 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n472\n%%EOF`;
          resolve(Buffer.from(pdfHeader));
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = PDFService;
