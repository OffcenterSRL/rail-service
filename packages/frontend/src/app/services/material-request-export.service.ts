import { Injectable } from '@angular/core';
import { Workbook, Fill, Worksheet, CellValue } from 'exceljs';
import { WorkOrder } from './work-order.service';

export interface MaterialRequestMaterial {
  codice_fs: string;
  codice_fornitore: string;
  codice_ditta_documento: string;
  descrizione: string;
  note: string;
  numero_documento: string;
  numero_pezzi: string;
  riferimento: string;
  segno_matr_pos: string;
  source_page: string;
  source_pdf: string;
  tavola: string;
  unita_conto: string;
}

export interface MaterialRequestSharedFields {
  cassa: string;
  note: string;
}

export interface MaterialRequestLineFields {
  avviso: string;
  guasto: string;
  quantity: string;
  tipoIntervento: string;
  um: string;
}

export interface MaterialRequestExportPayload {
  order: WorkOrder;
  materials: MaterialRequestMaterial[];
  shared: MaterialRequestSharedFields;
  lines: Record<string, MaterialRequestLineFields>;
}

type StyleKey = 'font' | 'alignment' | 'border' | 'fill' | 'protection' | 'numFmt';

@Injectable({
  providedIn: 'root',
})
export class MaterialRequestExportService {
  private readonly templateUrl = '/assets/materials-template/richiesta-materiale-template.xlsx';
  private readonly blockTemplateStart = 12;
  private readonly blockHeight = 4;
  private readonly footerStart = 16;
  private readonly editableColumnsEnd = 16;
  private readonly mergedBlockColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'I', 'J', 'K', 'N', 'O', 'P'];

  async exportRequest(payload: MaterialRequestExportPayload): Promise<void> {
    const workbook = await this.loadTemplateWorkbook();
    const worksheet = workbook.getWorksheet('MODULO RICHIESTA');
    if (!worksheet) {
      throw new Error('Template richiesta materiale non trovato.');
    }

    const blockCount = Math.max(payload.materials.length, 2);
    this.ensureMaterialBlocks(worksheet, blockCount);
    this.fillHeader(worksheet, payload);
    this.fillMaterialBlocks(worksheet, payload);
    this.clearExampleFills(worksheet, blockCount);

    const buffer = await workbook.xlsx.writeBuffer();
    this.downloadBuffer(buffer, this.buildFilename(payload.order));
  }

  private async loadTemplateWorkbook(): Promise<Workbook> {
    const response = await fetch(this.templateUrl);
    if (!response.ok) {
      throw new Error('Impossibile caricare il template Excel.');
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = new Workbook();
    await workbook.xlsx.load(arrayBuffer);
    return workbook;
  }

  private ensureMaterialBlocks(worksheet: Worksheet, blockCount: number): void {
    const extraBlocks = Math.max(0, blockCount - 2);
    if (!extraBlocks) {
      return;
    }

    const rowsToInsert = extraBlocks * this.blockHeight;
    worksheet.insertRows(this.footerStart, Array.from({ length: rowsToInsert }, () => []));

    for (let extraIndex = 0; extraIndex < extraBlocks; extraIndex += 1) {
      const targetStart = this.blockTemplateStart + this.blockHeight * (extraIndex + 1);
      this.cloneMaterialBlock(worksheet, this.blockTemplateStart, targetStart);
    }
  }

  private cloneMaterialBlock(worksheet: Worksheet, sourceStart: number, targetStart: number): void {
    for (let offset = 0; offset < this.blockHeight; offset += 1) {
      const sourceRow = worksheet.getRow(sourceStart + offset);
      const targetRow = worksheet.getRow(targetStart + offset);
      targetRow.height = sourceRow.height;

      for (let col = 1; col <= this.editableColumnsEnd; col += 1) {
        const sourceCell = sourceRow.getCell(col);
        const targetCell = targetRow.getCell(col);
        targetCell.value = this.cloneCellValue(sourceCell.value);
        this.copyCellStyle(sourceCell, targetCell);
      }
    }

    const targetEnd = targetStart + this.blockHeight - 1;
    for (const column of this.mergedBlockColumns) {
      this.safeUnmerge(worksheet, `${column}${targetStart}:${column}${targetEnd}`);
      worksheet.mergeCells(`${column}${targetStart}:${column}${targetEnd}`);
    }
    this.safeUnmerge(worksheet, `G${targetStart}:H${targetEnd}`);
    worksheet.mergeCells(`G${targetStart}:H${targetEnd}`);
  }

  private fillHeader(worksheet: Worksheet, payload: MaterialRequestExportPayload): void {
    const odlCode = payload.order.codiceODL.replace(/^ODL-/, '');
    const italyNow = this.getItalyNowParts();

    this.setCellValue(worksheet, 'C2', 'TOSCANA');
    this.setCellValue(worksheet, 'C3', odlCode);
    this.setCellValue(worksheet, 'C4', italyNow.date);
    this.setCellValue(worksheet, 'C5', italyNow.time);
    this.setCellValue(worksheet, 'G2', payload.order.trainNumber);
    this.setCellValue(worksheet, 'I2', payload.shared.cassa);
  }

  private fillMaterialBlocks(worksheet: Worksheet, payload: MaterialRequestExportPayload): void {
    payload.materials.forEach((material, index) => {
      const rowStart = 8 + index * this.blockHeight;
      const lineFields = payload.lines[this.getMaterialKey(material)];
      const code = material.numero_documento || material.codice_ditta_documento || material.codice_fs;

      this.setCellValue(worksheet, `A${rowStart}`, lineFields.avviso);
      this.setCellValue(worksheet, `B${rowStart}`, lineFields.tipoIntervento);
      this.setCellValue(worksheet, `E${rowStart}`, lineFields.guasto);
      this.setCellValue(worksheet, `F${rowStart}`, code);
      this.setCellValue(worksheet, `G${rowStart}`, material.descrizione);
      this.setCellValue(worksheet, `I${rowStart}`, this.normalizeNumberValue(lineFields.quantity));
      this.setCellValue(worksheet, `J${rowStart}`, lineFields.um);
    });

    const footerRow = this.getFooterStartRow(payload.materials.length);
    this.setCellValue(worksheet, `B${footerRow}`, payload.shared.note);
    worksheet.getCell(`B${footerRow}`).alignment = {
      ...worksheet.getCell(`B${footerRow}`).alignment,
      wrapText: true,
      vertical: 'top',
    };
  }

  private clearExampleFills(worksheet: Worksheet, blockCount: number): void {
    const noneFill = { type: 'pattern', pattern: 'none' } as Fill;
    const clearCells = ['C2', 'C3', 'C4', 'C5', 'G2', 'I2'];

    clearCells.forEach((address) => {
      worksheet.getCell(address).fill = noneFill;
    });

    for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
      const rowStart = 8 + blockIndex * this.blockHeight;
      const rowEnd = rowStart + this.blockHeight - 1;
      for (const column of ['A', 'B', 'E', 'F', 'G', 'H', 'I', 'J']) {
        for (let row = rowStart; row <= rowEnd; row += 1) {
          worksheet.getCell(`${column}${row}`).fill = noneFill;
        }
      }
    }

    const footerRow = this.getFooterStartRow(blockCount);
    for (let row = footerRow; row <= footerRow + 2; row += 1) {
      for (const column of ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) {
        worksheet.getCell(`${column}${row}`).fill = noneFill;
      }
    }
  }

  private getFooterStartRow(materialCount: number): number {
    return this.footerStart + Math.max(0, materialCount - 2) * this.blockHeight;
  }

  private setCellValue(worksheet: Worksheet, address: string, value: CellValue): void {
    worksheet.getCell(address).value = value;
  }

  private copyCellStyle(sourceCell: unknown, targetCell: unknown): void {
    const source = sourceCell as Record<string, unknown>;
    const target = targetCell as Record<string, unknown>;
    const styleKeys: StyleKey[] = ['font', 'alignment', 'border', 'fill', 'protection', 'numFmt'];
    for (const key of styleKeys) {
      const value = source[key];
      target[key] = value && typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value;
    }
  }

  private safeUnmerge(worksheet: Worksheet, range: string): void {
    try {
      worksheet.unMergeCells(range);
    } catch {
      // not merged, nothing to do
    }
  }

  private cloneCellValue(value: CellValue): CellValue {
    return value && typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value;
  }

  private normalizeNumberValue(value: string): string | number {
    const normalized = value.trim().replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && normalized !== '' ? parsed : value;
  }

  private buildFilename(order: WorkOrder): string {
    const suffix = this.getItalyNowParts().isoDate;
    return `Richiesta Materiale BLUES ${order.trainNumber} ${suffix}.xlsx`;
  }

  private getItalyNowParts(): { date: string; time: string; isoDate: string } {
    const formatter = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const get = (type: string): string => parts.find((part) => part.type === type)?.value ?? '';
    const day = get('day');
    const month = get('month');
    const year = get('year');
    const hour = get('hour');
    const minute = get('minute');

    return {
      date: `${day}/${month}/${year.slice(-2)}`,
      time: `${hour}:${minute}`,
      isoDate: `${year}-${month}-${day}`,
    };
  }

  private getMaterialKey(item: MaterialRequestMaterial): string {
    return [
      item.numero_documento,
      item.codice_fs,
      item.codice_fornitore,
      item.codice_ditta_documento,
      item.descrizione,
      item.numero_pezzi,
      item.source_pdf,
      item.source_page,
    ]
      .filter((value) => value && value.trim())
      .join('|');
  }

  private downloadBuffer(buffer: ArrayBuffer, filename: string): void {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
