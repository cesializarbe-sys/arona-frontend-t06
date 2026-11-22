import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import type { User } from '../types/domain';
import {
  formatExportDate,
  formatExportTime,
  formatExportTimestamp,
} from './formatDate';

const PDF_PRIMARY_GREEN: [number, number, number] = [27, 94, 32];
const PDF_ACCENT_GREEN: [number, number, number] = [76, 175, 80];
const PDF_SUBBG_GREEN: [number, number, number] = [232, 245, 233];
const PDF_BORDER_GRAY: [number, number, number] = [189, 189, 189];
const PDF_TEXT_GRAY: [number, number, number] = [66, 66, 66];
const PDF_LIGHT_GRAY: [number, number, number] = [158, 158, 158];
const PDF_BANNER_SEC_TEXT: [number, number, number] = [178, 223, 183];
const PDF_HEADER_BORDER: [number, number, number] = [21, 70, 24];

const XLS_PRIMARY_GREEN = '1B5E20';
const XLS_ACCENT_GREEN = '4CAF50';
const XLS_HEADER_GREEN = '228B22';
const XLS_ALT_GREEN = 'E6F5E6';
const XLS_STATUS_GREEN = 'C8E6C9';
const XLS_STATUS_GREEN_TXT = '1B5E20';
const XLS_STATUS_RED = 'FFCDD2';
const XLS_STATUS_RED_TXT = 'B71C1C';
const XLS_WHITE = 'FFFFFF';

const SYSTEM_NAME = 'Sociedad Agrícola Arona S.A.';
const SYSTEM_SUBTITLE = 'Sistema de Gestión Agrícola';

export async function exportUsersPdf(users: User[]): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateText = formatExportDate(now);
  const timeText = formatExportTime(now);
  const stamp = formatExportTimestamp(now);

  const bannerHeight = 30;
  doc.setFillColor(...PDF_PRIMARY_GREEN);
  doc.rect(0, 0, pageWidth, bannerHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE USUARIOS', 16, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_BANNER_SEC_TEXT);
  doc.text(SYSTEM_NAME, 16, 20);
  doc.text(SYSTEM_SUBTITLE, 16, 26);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Generado:', pageWidth - 14, 11, { align: 'right' });
  doc.text('Registros:', pageWidth - 14, 19, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_BANNER_SEC_TEXT);
  doc.text(`${dateText}  ${timeText}`, pageWidth - 14, 15, { align: 'right' });
  doc.text(String(users.length), pageWidth - 14, 23, { align: 'right' });

  doc.setFillColor(...PDF_ACCENT_GREEN);
  doc.rect(0, bannerHeight, pageWidth, 4, 'F');

  const headers = [['ID', 'Nombre Completo', 'DNI', 'Teléfono', 'Dirección', 'Correo', 'Rol', 'Área', 'Estado']];
  const rows = users.map((u, i) => [
    String(u.id || i + 1),
    u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '-',
    u.nationalId ?? '-',
    u.phone ?? '-',
    u.address ?? '-',
    u.email ?? '-',
    u.role ?? '-',
    u.area ?? '-',
    u.active !== false ? 'Activo' : 'Inactivo',
  ]);

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: bannerHeight + 6,
    margin: { left: 14, right: 14 },
    tableWidth: 264,
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      overflow: 'linebreak',
      lineColor: PDF_BORDER_GRAY,
      lineWidth: 0.3,
      textColor: PDF_TEXT_GRAY,
    },
    headStyles: {
      fillColor: PDF_PRIMARY_GREEN,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      lineColor: PDF_HEADER_BORDER,
      lineWidth: 0.4,
    },
    alternateRowStyles: {
      fillColor: PDF_SUBBG_GREEN,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 44 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 38 },
      5: { cellWidth: 52 },
      6: { cellWidth: 30, halign: 'center' },
      7: { cellWidth: 30, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        const isActive = String(data.cell.raw ?? '') === 'Activo';
        data.cell.styles.fillColor = isActive ? [200, 230, 201] : [255, 205, 210];
        data.cell.styles.textColor = isActive ? [27, 94, 32] : [183, 28, 28];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    didDrawPage: () => {
      const pageNum = doc.getCurrentPageInfo().pageNumber;
      const pageCount = doc.getNumberOfPages();
      doc.setDrawColor(...PDF_BORDER_GRAY);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PDF_LIGHT_GRAY);
      doc.text(
        `Arona Sistema Agrícola  •  Documento generado automáticamente  •  ${dateText} ${timeText}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
      doc.text(`Página ${pageNum} de ${pageCount}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
    },
  });

  doc.save(`usuarios_arona_${stamp}.pdf`);
}

export async function exportUsersExcel(users: User[]): Promise<void> {
  const now = new Date();
  const stamp = formatExportTimestamp(now);
  const dateText = formatExportDate(now);
  const timeText = formatExportTime(now);

  const headers = ['ID', 'Nombre Completo', 'DNI', 'Teléfono', 'Dirección', 'Correo', 'Rol', 'Área', 'Estado'];
  const rows = users.map((u) => [
    u.id ?? '',
    u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '',
    u.nationalId ?? '',
    u.phone ?? '',
    u.address ?? '',
    u.email,
    u.role ?? '',
    u.area ?? '',
    u.active !== false ? 'Activo' : 'Inactivo',
  ]);

  const titleRow = [`${SYSTEM_NAME} — Reporte de Usuarios`];
  const subtitleRow = [`Generado: ${dateText} ${timeText}   |   Total de registros: ${users.length}`];
  const separatorRow: string[] = [];

  const wsData = [titleRow, subtitleRow, separatorRow, headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData) as Record<string, unknown>;

  const maxWidths = [6, 35, 10, 12, 30, 38, 14, 15, 10];
  const minWidths = [4, 8, 5, 5, 8, 10, 5, 5, 8];

  ws['!cols'] = headers.map((h, ci) => {
    const contentMax = rows.reduce((m, r) => Math.max(m, String(r[ci] ?? '').length), h.length);
    const wch = Math.min(Math.max(contentMax + 2, minWidths[ci]), maxWidths[ci]);
    return { wch };
  });

  const lastCol = headers.length - 1;
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },
  ];

  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: 3, c: 0 }, e: { r: 3 + rows.length, c: lastCol } }),
  };
  ws['!freeze'] = { xSplit: 0, ySplit: 4 };

  const cellRef = (row: number, col: number) => `${String.fromCharCode(65 + col)}${row + 1}`;
  const borderStyle = { style: 'thin', color: { rgb: 'BDBDBD' } };
  const borderObj = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

  const getCell = (ref: string) => ws[ref] as { t?: string; v?: unknown; s?: unknown } | undefined;

  const cellA1 = getCell('A1');
  if (cellA1) {
    cellA1.s = {
      font: { bold: true, sz: 14, color: { rgb: XLS_WHITE } },
      fill: { fgColor: { rgb: XLS_PRIMARY_GREEN }, patternType: 'solid' },
      alignment: { horizontal: 'left', vertical: 'center' },
    };
  }
  for (let c = 1; c < headers.length; c++) {
    const ref = cellRef(0, c);
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    const cell = getCell(ref);
    if (cell) cell.s = { fill: { fgColor: { rgb: XLS_PRIMARY_GREEN }, patternType: 'solid' } };
  }

  const cellA2 = getCell('A2');
  if (cellA2) {
    cellA2.s = {
      font: { italic: true, sz: 9, color: { rgb: XLS_WHITE } },
      fill: { fgColor: { rgb: XLS_ACCENT_GREEN }, patternType: 'solid' },
      alignment: { horizontal: 'left', vertical: 'center' },
    };
  }
  for (let c = 1; c < headers.length; c++) {
    const ref = cellRef(1, c);
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    const cell = getCell(ref);
    if (cell) cell.s = { fill: { fgColor: { rgb: XLS_ACCENT_GREEN }, patternType: 'solid' } };
  }

  for (let c = 0; c < headers.length; c++) {
    const ref = cellRef(3, c);
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    const cell = getCell(ref);
    if (cell) {
      cell.s = {
        font: { bold: true, sz: 11, color: { rgb: XLS_WHITE } },
        fill: { fgColor: { rgb: XLS_HEADER_GREEN }, patternType: 'solid' },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderObj,
      };
    }
  }

  for (let r = 0; r < rows.length; r++) {
    const bg = r % 2 === 1 ? XLS_ALT_GREEN : XLS_WHITE;
    for (let c = 0; c < headers.length; c++) {
      const ref = cellRef(4 + r, c);
      const cell = getCell(ref);
      if (!cell) continue;
      if (c === 8) {
        const isActive = String(cell.v ?? '') === 'Activo';
        cell.s = {
          font: { bold: true, sz: 10, color: { rgb: isActive ? XLS_STATUS_GREEN_TXT : XLS_STATUS_RED_TXT } },
          fill: { fgColor: { rgb: isActive ? XLS_STATUS_GREEN : XLS_STATUS_RED }, patternType: 'solid' },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderObj,
        };
      } else {
        cell.s = {
          fill: { fgColor: { rgb: bg }, patternType: 'solid' },
          alignment: { vertical: 'center', horizontal: c === 0 ? 'center' : 'left' },
          border: borderObj,
        };
      }
    }
  }

  ws['!rows'] = [
    { hpt: 26 },
    { hpt: 16 },
    { hpt: 6 },
    { hpt: 20 },
    ...Array(rows.length).fill({ hpt: 16 }),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws as XLSX.WorkSheet, 'Usuarios');
  XLSX.writeFile(wb, `usuarios_arona_${stamp}.xlsx`);
}
