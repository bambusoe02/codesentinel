'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Copy,
  Share2,
  Link,
  Mail,
  MessageSquare,
  Twitter,
  Facebook,
  Linkedin,
} from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  reportId?: string;
}

export function ShareModal({ isOpen, onClose, repoName, reportId }: ShareModalProps) {
  const [shareLink, setShareLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate shareable link (mock implementation)
  const generateShareLink = async () => {
    setIsGenerating(true);
    // In real implementation, this would create a share token in the database
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockToken = Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/shared/${mockToken}`;
    setShareLink(link);
    setIsGenerating(false);
    toast.success('Shareable link generated!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const shareViaEmail = () => {
    const subject = `CodeSentinel Analysis: ${repoName}`;
    const body = `Check out this repository analysis report for ${repoName}:\n\n${shareLink}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareOnTwitter = () => {
    const text = `Check out the CodeSentinel analysis for ${repoName}! 🔍`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`;
    window.open(url, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share Analysis Report</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Repository Info */}
          <div className="text-center">
            <h3 className="font-semibold">{repoName}</h3>
            <p className="text-sm text-muted-foreground">Repository Analysis Report</p>
            <Badge variant="secondary" className="mt-2">
              Generated {new Date().toLocaleDateString()}
            </Badge>
          </div>

          <Separator />

          {/* Generate Link */}
          {!shareLink ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a shareable link to share this analysis report with stakeholders.
                  The link will be valid for 30 days.
                </p>
                <Button onClick={generateShareLink} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Generate Share Link'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Share Link */}
              <div className="space-y-2">
                <Label htmlFor="share-link">Shareable Link</Label>
                <div className="flex space-x-2">
                  <Input
                    id="share-link"
                    value={shareLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareLink)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Share Options */}
              <div>
                <Label className="text-sm font-medium">Share via</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareViaEmail}
                    className="justify-start"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareLink)}
                    className="justify-start"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareOnTwitter}
                    className="justify-start"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareOnLinkedIn}
                    className="justify-start"
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Security Notice:</strong> Shared links do not expose your repository code or sensitive information.
                  Only analysis results and recommendations are shared.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
