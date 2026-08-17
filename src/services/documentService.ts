/**
 * Document & PDF Formatting Helper Service
 * Generates styled HTML templates for WebView live preview and offline rendering
 */

export interface DocumentSection {
  heading: string;
  body: string;
}

export interface DocumentItem {
  id?: string;
  title: string;
  description?: string;
  completed?: boolean;
  mode?: boolean;
}

export interface DocumentPayload {
  title: string;
  subtitle?: string;
  category?: string;
  author?: string;
  date?: string;
  items?: DocumentItem[];
  sections?: DocumentSection[];
  signatureBase64?: string | null;
  watermarkText?: string;
  themeColor?: string;
}

export class DocumentService {
  /**
   * Generates clean HTML template string for real-time WebView preview and client PDF rendering
   */
  static generateHTMLTemplate(payload: DocumentPayload, isDark: boolean = false): string {
    const {
      title = 'Document Report',
      subtitle = 'Generated via Node.js + React Native Document Engine',
      category = 'General Report',
      author = 'App User',
      date = new Date().toLocaleDateString(),
      items = [],
      sections = [],
      signatureBase64 = null,
      watermarkText = 'CONFIDENTIAL REPORT',
      themeColor = '#6200EE'
    } = payload;

    const bgColor = isDark ? '#121212' : '#FFFFFF';
    const cardBg = isDark ? '#1E1E1E' : '#F9F9FB';
    const textColor = isDark ? '#EEEEEE' : '#222222';
    const subtextColor = isDark ? '#AAAAAA' : '#666666';
    const borderColor = isDark ? '#333333' : '#E5E5EA';

    const itemRowsHTML = items.map((item, idx) => `
      <tr style="border-bottom: 1px solid ${borderColor};">
        <td style="padding: 10px; font-weight: bold; color: ${themeColor};">${idx + 1}</td>
        <td style="padding: 10px;">
          <div style="font-weight: 600;">${item.title || 'Untitled Task'}</div>
          ${item.description ? `<div style="font-size: 12px; color: ${subtextColor}; margin-top: 2px;">${item.description}</div>` : ''}
        </td>
        <td style="padding: 10px;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${item.completed ? '#E8F5E9' : '#FFF3E0'}; color: ${item.completed ? '#2E7D32' : '#E65100'};">
            ${item.completed ? '✓ COMPLETED' : '⏳ PENDING'}
          </span>
        </td>
        <td style="padding: 10px; font-size: 12px; color: ${subtextColor};">
          ${item.mode !== false ? '🌐 ONLINE' : '📲 OFFLINE'}
        </td>
      </tr>
    `).join('');

    const sectionsHTML = sections.map(sec => `
      <div style="margin-top: 20px; padding: 16px; background: ${cardBg}; border-radius: 8px; border-left: 4px solid ${themeColor};">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: ${themeColor};">${sec.heading}</h3>
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: ${textColor};">${sec.body}</p>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: ${bgColor};
            color: ${textColor};
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
            position: relative;
          }
          .watermark {
            position: fixed;
            top: 40%;
            left: 10%;
            right: 10%;
            text-align: center;
            font-size: 44px;
            font-weight: 900;
            color: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'};
            transform: rotate(-30deg);
            pointer-events: none;
            text-transform: uppercase;
            letter-spacing: 4px;
            z-index: 0;
          }
          .content {
            position: relative;
            z-index: 1;
          }
          .header {
            border-bottom: 2px solid ${themeColor};
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 26px;
            font-weight: 800;
            color: ${themeColor};
            margin: 0 0 6px 0;
          }
          .subtitle {
            font-size: 14px;
            color: ${subtextColor};
            margin: 0 0 12px 0;
          }
          .meta-grid {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: ${subtextColor};
            background: ${cardBg};
            padding: 10px 14px;
            border-radius: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            background: ${cardBg};
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background-color: ${themeColor};
            color: #FFFFFF;
            text-align: left;
            padding: 12px 10px;
            font-size: 13px;
          }
          .signature-box {
            margin-top: 30px;
            padding: 16px;
            border: 1px dashed ${themeColor};
            border-radius: 8px;
            display: inline-block;
          }
          .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid ${borderColor};
            text-align: center;
            font-size: 11px;
            color: ${subtextColor};
          }
        </style>
      </head>
      <body>
        <div class="watermark">${watermarkText}</div>
        <div class="content">
          <div class="header">
            <h1 class="title">${title}</h1>
            <p class="subtitle">${subtitle}</p>
            <div class="meta-grid">
              <span><strong>Category:</strong> ${category}</span>
              <span><strong>Author:</strong> ${author}</span>
              <span><strong>Date:</strong> ${date}</span>
            </div>
          </div>

          ${items.length > 0 ? `
            <h2 style="font-size: 18px; color: ${textColor}; margin: 20px 0 10px 0;">Item List & Tasks Summary</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody>
                ${itemRowsHTML}
              </tbody>
            </table>
          ` : ''}

          ${sectionsHTML}

          ${signatureBase64 ? `
            <div class="signature-box">
              <div style="font-size: 12px; font-weight: bold; color: ${themeColor}; margin-bottom: 6px;">Verified Digital Signature:</div>
              <img src="${signatureBase64}" alt="Digital Signature" style="max-height: 70px; max-width: 220px;" />
            </div>
          ` : ''}

          <div class="footer">
            Generated via Node.js & React Native Document Engine • Confidential Report
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default DocumentService;
