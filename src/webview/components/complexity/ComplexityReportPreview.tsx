import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';
import type { ComplexityReport } from '../../../core/complexity/reports/ComplexityReportGenerator';
import { ComplexityReportGenerator } from '../../../core/complexity/reports/ComplexityReportGenerator';
import { ReportExporter } from '../../../core/complexity/reports/ReportExporter';

interface ComplexityReportPreviewProps {
  report: ComplexityReport | null;
}

const exporter = new ReportExporter();
const generator = new ComplexityReportGenerator();

export const ComplexityReportPreview: FunctionComponent<ComplexityReportPreviewProps> = ({ report }) => {
  const [preview, setPreview] = useState<string | null>(null);

  if (!report) {
    return (
      <Box
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          textAlign: 'center',
        }}
      >
        <Text as="p" style={{ ...TYPOGRAPHY.body, color: COLORS.textMuted, margin: 0 }}>
          Configure an input and run an operation-counting experiment to build a report. One instrumented run is enough;
          benchmark results are included only if you actually ran one.
        </Text>
      </Box>
    );
  }

  const handlePreview = (): void => {
    setPreview(generator.generateMarkdown(report));
  };

  const handleExport = (format: 'markdown' | 'csv' | 'json'): void => {
    exporter.download(report, format);
  };

  return (
    <Box
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      }}
    >
      <Text as="h3" style={{ ...TYPOGRAPHY.h3, color: COLORS.textPrimary, margin: '0 0 0.25rem 0' }}>
        Complexity Report
      </Text>
      <Text as="p" style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, margin: '0 0 1rem 0' }}>
        The report labels every value as theoretical, instrumented, estimated or measured. Observed operation counts are
        included from the instrumented run; benchmark statistics are included only when you actually ran a benchmark.
        Exports open a save dialog in VS Code.
      </Text>

      <Flex gap={SPACING.md} style={{ flexWrap: 'wrap', marginBottom: SPACING.md } as React.CSSProperties}>
        <Button variant="secondary" size="sm" onClick={handlePreview}>
          {preview ? 'Refresh markdown preview' : 'Preview markdown'}
        </Button>
        <Button variant="primary" size="sm" onClick={() => handleExport('markdown')}>
          Export .md
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleExport('csv')}>
          Export .csv
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleExport('json')}>
          Export .json
        </Button>
      </Flex>

      {preview && (
        <Box
          style={{
            backgroundColor: '#0f172a',
            borderRadius: RADIUS.md,
            padding: SPACING.lg,
            fontFamily: '"SF Mono", Menlo, monospace',
            fontSize: '0.8rem',
            lineHeight: 1.6,
            maxHeight: 520,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            color: COLORS.textSecondary,
          }}
        >
          {preview}
        </Box>
      )}
    </Box>
  );
};
