export interface PrintColumn {
  header: string;
  accessor: (row: any) => string | number;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export function printDataset(options: {
  title: string;
  subtitle?: string;
  academicYear?: string;
  activeFilters?: Record<string, string | number | undefined>;
  columns: PrintColumn[];
  data: any[];
}) {
  const { title, subtitle, academicYear = '2026–2027', activeFilters = {}, columns, data } = options;

  const filterItems = Object.entries(activeFilters)
    .filter(([_, val]) => val !== undefined && val !== '')
    .map(([key, val]) => `${key.replace('_', ' ').toUpperCase()}: ${val}`)
    .join('  •  ');

  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    alert('Please allow popups to print documents.');
    return;
  }

  const tableHeadersHtml = columns
    .map(
      (c) =>
        `<th style="padding: 10px; border-bottom: 2px solid #000; text-align: ${c.align || 'left'}; font-size: 13px; font-weight: bold; uppercase;">${c.header}</th>`
    )
    .join('');

  const tableRowsHtml = data
    .map(
      (row, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
      ${columns
        .map(
          (c) =>
            `<td style="padding: 8px 10px; font-size: 12px; text-align: ${c.align || 'left'}; font-family: ${c.align === 'right' ? 'monospace' : 'inherit'};">${c.accessor(row)}</td>`
        )
        .join('')}
    </tr>
  `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} — CANISIUS SECONDARY SCHOOL</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Inter', -apple-system, sans-serif; color: #111827; margin: 0; padding: 10px; }
          .header { border-bottom: 3px double #111827; padding-bottom: 10px; margin-bottom: 15px; }
          .school-title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; margin: 0; }
          .doc-title { font-size: 16px; font-weight: 800; margin-top: 4px; margin-bottom: 2px; color: #1e3a8a; }
          .meta-info { font-size: 12px; font-weight: 600; color: #4b5563; margin-top: 4px; }
          .filter-bar { background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 8px 12px; font-size: 11px; font-weight: 700; border-radius: 6px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .footer { border-top: 1px solid #9ca3af; padding-top: 8px; font-size: 11px; color: #6b7280; display: flex; justify-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="school-title">CANISIUS SECONDARY SCHOOL</h1>
          <div class="doc-title">${title.toUpperCase()}</div>
          <div class="meta-info">Academic Year: ${academicYear} ${subtitle ? `• ${subtitle}` : ''}</div>
        </div>

        ${filterItems ? `<div class="filter-bar">ACTIVE FILTERS: ${filterItems}</div>` : ''}

        <table>
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml || '<tr><td colSpan="100%" style="text-align: center; padding: 20px;">No matching records found.</td></tr>'}
          </tbody>
        </table>

        <div style="margin-top: 15px; font-size: 12px; font-weight: 800;">
          TOTAL MATCHING RECORDS: ${data.length}
        </div>

        <div class="footer" style="margin-top: 30px;">
          <span>Generated from CANISIUS SECONDARY SCHOOL Digital Ledger • ${new Date().toLocaleString()}</span>
          <span style="float: right;">Official School Document</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
