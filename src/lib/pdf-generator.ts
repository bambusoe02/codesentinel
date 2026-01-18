import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFReportData {
  repoName: string;
  overallScore: number;
  techDebtScore: number;
  securityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
  issues: Array<{
    severity: string;
    title: string;
    description: string;
    impact: string;
    fix: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: number;
    impact: string;
    effort: string;
  }>;
  metrics: {
    linesOfCode: number;
    filesCount: number;
    contributors: number;
    languages: Record<string, number>;
  };
  generatedAt: Date;
}

export class PDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  async generateReport(data: PDFReportData): Promise<Blob> {
    const { doc } = this;

    // Set up fonts and colors
    doc.setFont('helvetica', 'normal');

    // Title page
    this.addTitlePage(data);

    // Executive Summary
    doc.addPage();
    this.addExecutiveSummary(data);

    // Detailed Scores
    doc.addPage();
    this.addScoreBreakdown(data);

    // Issues and Recommendations
    doc.addPage();
    this.addIssuesAndRecommendations(data);

    // Repository Metrics
    doc.addPage();
    this.addRepositoryMetrics(data);

    // Footer on all pages
    this.addFooter();

    return doc.output('blob');
  }

  private addTitlePage(data: PDFReportData) {
    const { doc } = this;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(59, 130, 246); // Blue background
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.text('CodeSentinel', pageWidth / 2, 60, { align: 'center' });

    doc.setFontSize(24);
    doc.text('Repository Analysis Report', pageWidth / 2, 90, { align: 'center' });

    // Repository info
    doc.setFontSize(18);
    doc.setTextColor(240, 240, 240);
    doc.text(`Repository: ${data.repoName}`, pageWidth / 2, 130, { align: 'center' });

    // Overall score
    doc.setFontSize(48);
    doc.setTextColor(255, 255, 255);
    doc.text(`${data.overallScore}/100`, pageWidth / 2, 180, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(240, 240, 240);
    doc.text('Overall Health Score', pageWidth / 2, 200, { align: 'center' });

    // Generated date
    doc.setFontSize(12);
    doc.setTextColor(200, 200, 200);
    doc.text(
      `Generated on ${data.generatedAt.toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 30,
      { align: 'center' }
    );
  }

  private addExecutiveSummary(data: PDFReportData) {
    const { doc } = this;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Executive Summary', 20, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    let y = 50;
    const lineHeight = 6;

    const summary = `
Repository Health Overview:

• Overall Score: ${data.overallScore}/100
• Security Score: ${data.securityScore}/100
• Performance Score: ${data.performanceScore}/100
• Maintainability Score: ${data.maintainabilityScore}/100
• Technical Debt Score: ${data.techDebtScore}/100

Key Findings:
• ${data.issues.length} issues identified across all categories
• ${data.recommendations.length} prioritized recommendations provided
• Repository contains ${data.metrics.linesOfCode.toLocaleString()} lines of code across ${data.metrics.filesCount} files
    `;

    const lines = summary.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        doc.text(line.trim(), 20, y);
        y += lineHeight;
      }
    });

    // Score visualization
    y += 20;
    this.addScoreChart(data, y);
  }

  private addScoreChart(data: PDFReportData, startY: number) {
    const { doc } = this;
    const chartWidth = 120;
    const chartHeight = 60;
    const startX = 20;

    // Chart background
    doc.setFillColor(245, 245, 245);
    doc.rect(startX, startY, chartWidth, chartHeight, 'F');

    // Bars
    const scores = [
      { label: 'Security', value: data.securityScore, color: [34, 197, 94] },
      { label: 'Performance', value: data.performanceScore, color: [59, 130, 246] },
      { label: 'Maintainability', value: data.maintainabilityScore, color: [245, 158, 11] },
    ];

    const barWidth = 25;
    const maxBarHeight = 40;
    const spacing = 15;

    scores.forEach((score, index) => {
      const x = startX + 10 + (index * (barWidth + spacing));
      const barHeight = (score.value / 100) * maxBarHeight;

      // Bar
      doc.setFillColor(score.color[0], score.color[1], score.color[2]);
      doc.rect(x, startY + chartHeight - barHeight - 10, barWidth, barHeight, 'F');

      // Label
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.text(score.label, x + barWidth / 2, startY + chartHeight - 2, { align: 'center' });
      doc.text(`${score.value}`, x + barWidth / 2, startY + chartHeight - barHeight - 12, { align: 'center' });
    });
  }

  private addScoreBreakdown(data: PDFReportData) {
    const { doc } = this;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Score Breakdown', 20, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    const scores = [
      { label: 'Overall Health', value: data.overallScore, description: 'Combined score across all categories' },
      { label: 'Security', value: data.securityScore, description: 'Security vulnerabilities and risks' },
      { label: 'Performance', value: data.performanceScore, description: 'Performance and optimization issues' },
      { label: 'Maintainability', value: data.maintainabilityScore, description: 'Code quality and technical debt' },
      { label: 'Technical Debt', value: data.techDebtScore, description: 'Accumulated technical debt level' },
    ];

    let y = 50;
    scores.forEach(score => {
      // Progress bar background
      doc.setFillColor(230, 230, 230);
      doc.rect(20, y, 100, 8, 'F');

      // Progress bar fill
      const fillWidth = (score.value / 100) * 100;
      doc.setFillColor(59, 130, 246);
      doc.rect(20, y, fillWidth, 8, 'F');

      // Text
      doc.setTextColor(0, 0, 0);
      doc.text(`${score.label}: ${score.value}/100`, 130, y + 6);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(score.description, 130, y + 12);

      y += 25;
    });
  }

  private addIssuesAndRecommendations(data: PDFReportData) {
    const { doc } = this;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Issues & Recommendations', 20, 30);

    let y = 50;

    // Issues
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Critical Issues', 20, y);
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const criticalIssues = data.issues.filter(issue => issue.severity === 'critical' || issue.severity === 'high');
    criticalIssues.slice(0, 5).forEach(issue => {
      if (y > 250) {
        doc.addPage();
        y = 30;
      }

      doc.setFillColor(254, 226, 226);
      doc.rect(20, y - 5, doc.internal.pageSize.getWidth() - 40, 25, 'F');

      doc.setTextColor(0, 0, 0);
      doc.text(`${issue.title}`, 25, y);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Impact: ${issue.impact}`, 25, y + 8);
      doc.text(`Fix: ${issue.fix}`, 25, y + 14);

      y += 30;
    });

    // Recommendations
    if (y > 200) {
      doc.addPage();
      y = 30;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Top Recommendations', 20, y);
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    data.recommendations.slice(0, 5).forEach(rec => {
      if (y > 250) {
        doc.addPage();
        y = 30;
      }

      doc.setFillColor(226, 254, 226);
      doc.rect(20, y - 5, doc.internal.pageSize.getWidth() - 40, 25, 'F');

      doc.setTextColor(0, 0, 0);
      doc.text(`${rec.title}`, 25, y);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Impact: ${rec.impact} | Effort: ${rec.effort}`, 25, y + 8);
      doc.text(`${rec.description}`, 25, y + 14);

      y += 30;
    });
  }

  private addRepositoryMetrics(data: PDFReportData) {
    const { doc } = this;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Repository Metrics', 20, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    let y = 50;

    // Basic metrics
    const metrics = [
      ['Lines of Code', data.metrics.linesOfCode.toLocaleString()],
      ['Files', data.metrics.filesCount.toString()],
      ['Contributors', data.metrics.contributors.toString()],
      ['Languages', Object.keys(data.metrics.languages).length.toString()],
    ];

    metrics.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 20, y);
      y += 10;
    });

    // Language breakdown
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Language Breakdown', 20, y);
    y += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    Object.entries(data.metrics.languages).forEach(([lang, percentage]) => {
      const barWidth = (percentage / 100) * 80;
      doc.setFillColor(59, 130, 246);
      doc.rect(20, y - 3, barWidth, 6, 'F');
      doc.setTextColor(0, 0, 0);
      doc.text(`${lang}: ${percentage}%`, 110, y);
      y += 12;
    });
  }

  private addFooter() {
    const { doc } = this;
    const pageCount = doc.internal.pages.length - 1;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated by CodeSentinel - Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
  }

  // Alternative method using html2canvas for more complex layouts
  async generateReportFromHTML(elementId: string, data: PDFReportData): Promise<Blob> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const { doc } = this;

    // Calculate dimensions to fit the canvas
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return doc.output('blob');
  }
}

// Utility functions
export const downloadPDF = async (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const generateReportFilename = (repoName: string): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const cleanRepoName = repoName.replace('/', '-');
  return `codesentinel-${cleanRepoName}-${timestamp}.pdf`;
};
