export interface PrintColumn {
  header: string;
  accessor: (item: any) => any;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface PrintDatasetConfig {
  title: string;
  subtitle?: string;
  academicYear?: string;
  columns: PrintColumn[];
  data: any[];
}

export function printDataset(config: PrintDatasetConfig) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups for this site to print receipts.');
    return;
  }

  const { title, subtitle, academicYear = '2026–2027', columns, data } = config;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 10px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .school-name {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #1e1b4b;
            text-transform: uppercase;
          }
          .report-title {
            font-size: 16px;
            font-weight: 700;
            color: #4338ca;
            margin-top: 4px;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #475569;
            margin-bottom: 16px;
            font-family: monospace;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th {
            background-color: #f1f5f9;
            color: #1e293b;
            font-weight: 700;
            text-transform: uppercase;
            padding: 8px 10px;
            border-bottom: 2px solid #94a3b8;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .footer {
            margin-top: 24px;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            font-size: 10px;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">CANISIUS SECONDARY SCHOOL</div>
          <div class="report-title">${title}</div>
          ${subtitle ? `<div style="font-size: 13px; color: #475569; margin-top: 2px;">${subtitle}</div>` : ''}
        </div>
        
        <div class="meta">
          <span>Academic Year: <strong>${academicYear}</strong></span>
          <span>Printed: <strong>${new Date().toLocaleString('en-IN')}</strong></span>
        </div>

        <table>
          <thead>
            <tr>
              ${columns
                .map(
                  (col) =>
                    `<th class="text-${col.align || 'left'}" style="${col.width ? `width: ${col.width};` : ''}">${col.header}</th>`
                )
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
                <tr>
                  ${columns
                    .map((col) => {
                      const val = col.accessor(row);
                      return `<td class="text-${col.align || 'left'}">${val !== undefined && val !== null ? val : '-'}</td>`;
                    })
                    .join('')}
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          Official Financial Document • Canisius Secondary School Student Pocket Money System • Page 1 of 1
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
