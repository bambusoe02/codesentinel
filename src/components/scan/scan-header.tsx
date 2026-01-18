'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ShareModal } from './share-modal';
import { usePDFExport } from '@/hooks/use-pdf-export';
import {
  ArrowLeft,
  Github,
  Download,
  Share2,
  Settings,
} from 'lucide-react';

interface ScanHeaderProps {
  repoName: string;
}

export function ScanHeader({ repoName }: ScanHeaderProps) {
  const [owner, name] = repoName.split('/');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { exportReport, isExporting } = usePDFExport();

  const handleExportPDF = () => {
    // Mock data - in real implementation, this would come from the analysis results
    const mockData = {
      repoName,
      overallScore: 78,
      techDebtScore: 35,
      securityScore: 85,
      performanceScore: 72,
      maintainabilityScore: 65,
      issues: [
        {
          severity: 'high',
          title: 'Security vulnerability in dependencies',
          description: 'Outdated packages with known vulnerabilities',
          impact: 'Potential security breaches',
          fix: 'Update dependencies to latest secure versions',
        },
      ],
      recommendations: [
        {
          title: 'Implement automated testing',
          description: 'Add comprehensive test suite',
          priority: 8,
          impact: 'Improved code reliability',
          effort: 'high',
        },
      ],
      metrics: {
        linesOfCode: 15420,
        filesCount: 247,
        contributors: 8,
        languages: { TypeScript: 65, JavaScript: 25, Other: 10 },
      },
      generatedAt: new Date(),
    };

    exportReport(mockData);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                <Github className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold">{name}</h1>
                <Badge variant="outline">Analyzing</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{repoName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        repoName={repoName}
      />
    </header>
  );
}
