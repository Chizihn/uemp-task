// pdfkit's CJS export is the constructor itself (`module.exports = PDFDocument`), and this
// project's tsconfig doesn't set `esModuleInterop`, so a plain `import PDFDocument from
// 'pdfkit'` compiles to a `.default` lookup that doesn't exist at runtime. `import =
// require()` sidesteps that interop entirely.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');

type PDFDoc = InstanceType<typeof PDFDocument>;

interface Column {
  header: string;
  width: number;
  get: (row: Record<string, unknown>) => string;
}

function renderTable(
  doc: PDFDoc,
  title: string,
  columns: Column[],
  rows: Record<string, unknown>[],
) {
  doc.fontSize(18).text('University Education Management Portal', { align: 'center' });
  doc.fontSize(13).text(title, { align: 'center' });
  doc
    .fontSize(9)
    .fillColor('#666')
    .text(`Generated ${new Date().toLocaleString()}`, { align: 'center' });
  doc.fillColor('#000').moveDown(1.5);

  const startX = doc.page.margins.left;
  let y = doc.y;
  const rowHeight = 22;

  function drawRow(values: string[], isHeader: boolean) {
    let x = startX;
    doc.fontSize(9).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
    values.forEach((value, i) => {
      doc.text(value, x, y, { width: columns[i].width, ellipsis: true });
      x += columns[i].width;
    });
    y += rowHeight;
    if (isHeader) {
      doc
        .moveTo(startX, y - 4)
        .lineTo(x, y - 4)
        .strokeColor('#ccc')
        .stroke();
    }
  }

  drawRow(
    columns.map((c) => c.header),
    true,
  );

  if (rows.length === 0) {
    doc.fontSize(9).font('Helvetica').fillColor('#666').text('No data for this period.', startX, y);
    return;
  }

  for (const row of rows) {
    if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
      doc.addPage();
      y = doc.page.margins.top;
      drawRow(
        columns.map((c) => c.header),
        true,
      );
    }
    drawRow(
      columns.map((c) => c.get(row)),
      false,
    );
  }
}

function toBuffer(doc: PDFDoc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export interface RegistrationSummaryRow {
  course: string;
  title: string;
  units: number;
  registered: number;
}

export async function buildRegistrationSummaryPdf(
  rows: RegistrationSummaryRow[],
  periodLabel: string,
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40 });
  renderTable(
    doc,
    `Registration Summary — ${periodLabel}`,
    [
      { header: 'Course', width: 80, get: (r) => String(r.course) },
      { header: 'Title', width: 260, get: (r) => String(r.title) },
      { header: 'Units', width: 60, get: (r) => String(r.units) },
      { header: 'Registered', width: 90, get: (r) => String(r.registered) },
    ],
    rows as unknown as Record<string, unknown>[],
  );
  return toBuffer(doc);
}

export interface PerformanceSummaryRow {
  course: string;
  title: string;
  studentsGraded: number;
  averageScore: number;
  gradeDistribution: Record<string, number>;
}

export async function buildPerformanceSummaryPdf(
  rows: PerformanceSummaryRow[],
  periodLabel: string,
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40 });
  renderTable(
    doc,
    `Performance Summary — ${periodLabel}`,
    [
      { header: 'Course', width: 70, get: (r) => String(r.course) },
      { header: 'Title', width: 180, get: (r) => String(r.title) },
      { header: 'Graded', width: 60, get: (r) => String(r.studentsGraded) },
      { header: 'Avg Score', width: 70, get: (r) => String(r.averageScore) },
      {
        header: 'Grade Distribution',
        width: 150,
        get: (r) =>
          Object.entries(r.gradeDistribution as Record<string, number>)
            .map(([grade, count]) => `${grade}:${count}`)
            .join('  '),
      },
    ],
    rows as unknown as Record<string, unknown>[],
  );
  return toBuffer(doc);
}
