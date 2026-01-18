import { useState } from 'react';
import { PDFGenerator, PDFReportData, downloadPDF, generateReportFilename } from '@/lib/pdf-generator';
import { toast } from 'sonner';

export function usePDFExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportReport = async (data: PDFReportData) => {
    setIsExporting(true);
    try {
      const generator = new PDFGenerator();
      const blob = await generator.generateReport(data);

      const filename = generateReportFilename(data.repoName);
      downloadPDF(blob, filename);

      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportReportFromHTML = async (elementId: string, data: PDFReportData) => {
    setIsExporting(true);
    try {
      const generator = new PDFGenerator();
      const blob = await generator.generateReportFromHTML(elementId, data);

      const filename = generateReportFilename(data.repoName);
      downloadPDF(blob, filename);

      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportReport,
    exportReportFromHTML,
    isExporting,
  };
}
