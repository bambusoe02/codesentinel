'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ShareModal } from './share-modal';
import { usePDFExportContext } from '@/contexts/pdf-export-context';
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
  const [, name] = repoName.split('/');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { onExportPDF, isExportingPDF } = usePDFExportContext();

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
          {/* PDF Export temporarily disabled */}
          {false && onExportPDF && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPDF}
              disabled={true}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF (Disabled)
            </Button>
          )}
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
