import { ComplexityReportGenerator } from './ComplexityReportGenerator';
import type { ComplexityReport } from './ComplexityReportGenerator';
import { postToExtension } from '../../../webview/utils';

export type ExportFormat = 'markdown' | 'csv' | 'json';

export interface ExportPayload {
  content: string;
  fileName: string;
  languageId: string;
}

export class ReportExporter {
  private generator = new ComplexityReportGenerator();

  export(report: ComplexityReport, format: ExportFormat): string {
    switch (format) {
    case 'markdown':
      return this.generator.generateMarkdown(report);
    case 'csv':
      return this.generator.generateCSV(report);
    case 'json':
      return this.generator.generateJSON(report);
    default:
      throw new Error(`Unsupported format: ${format}`);
    }
  }

  buildPayload(report: ComplexityReport, format: ExportFormat, filename?: string): ExportPayload {
    const content = this.export(report, format);
    const extensions: Record<ExportFormat, { ext: string; languageId: string }> = {
      markdown: { ext: 'md', languageId: 'markdown' },
      csv: { ext: 'csv', languageId: 'csv' },
      json: { ext: 'json', languageId: 'json' },
    };
    const name =
      filename ??
      `${report.algorithmId}-complexity-report-${new Date(report.generatedAt).toISOString().slice(0, 10)}.${extensions[format].ext}`;
    return { content, fileName: name, languageId: extensions[format].languageId };
  }

  /**
   * Sends an export payload to the extension host, which shows a save dialog.
   * Falls back to a plain-browser download when the VS Code bridge is absent
   * (e.g. previews outside VS Code).
   */
  download(report: ComplexityReport, format: ExportFormat, filename?: string): void {
    const payload = this.buildPayload(report, format, filename);
    postToExtension({ type: 'EXPORT_REPORT', payload });
  }
}
