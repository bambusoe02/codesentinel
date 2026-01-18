'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface CodeIssue {
  file: string;
  line: number;
  type: 'error' | 'warning' | 'info';
  message: string;
  code?: string;
  suggestion?: string;
}

interface CodeHighlightsProps {
  issues: CodeIssue[];
  files: Array<{
    name: string;
    content: string;
    language: string;
  }>;
}

// Mock code issues - in real app this would come from analysis
const mockIssues: CodeIssue[] = [
  {
    file: 'src/components/Button.tsx',
    line: 15,
    type: 'warning',
    message: 'Unused import detected',
    code: 'import { useState } from \'react\';',
    suggestion: 'Remove unused import or use the imported function',
  },
  {
    file: 'src/utils/api.ts',
    line: 23,
    type: 'error',
    message: 'Potential null pointer dereference',
    code: 'const data = response.data;',
    suggestion: 'Add null check: const data = response?.data;',
  },
  {
    file: 'src/pages/Dashboard.tsx',
    line: 45,
    type: 'info',
    message: 'Consider using useMemo for expensive computation',
    code: 'const filteredData = data.filter(item => item.active);',
    suggestion: 'Wrap with useMemo if data changes infrequently',
  },
];

const mockFiles = [
  {
    name: 'src/components/Button.tsx',
    content: `import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
}) => {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-colors',
        variant === 'primary'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};`,
    language: 'typescript',
  },
];

export function CodeHighlights({ issues = mockIssues, files = mockFiles }: CodeHighlightsProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Issues Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Code Issues Found</span>
            <Badge variant="outline">{issues.length} issues</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {issues.filter(i => i.type === 'error').length}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {issues.filter(i => i.type === 'warning').length}
              </div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {issues.filter(i => i.type === 'info').length}
              </div>
              <div className="text-sm text-muted-foreground">Suggestions</div>
            </div>
          </div>

          <div className="space-y-3">
            {issues.slice(0, 5).map((issue, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedFile(issue.file)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {issue.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                    {issue.type === 'info' && <CheckCircle className="w-4 h-4 text-blue-500" />}
                    <span className="font-medium">{issue.message}</span>
                  </div>
                  <Badge
                    variant={
                      issue.type === 'error'
                        ? 'destructive'
                        : issue.type === 'warning'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {issue.type}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {issue.file}:{issue.line}
                </div>
                {issue.code && (
                  <div className="bg-muted p-2 rounded text-sm font-mono mb-2">
                    {issue.code}
                  </div>
                )}
                {issue.suggestion && (
                  <div className="text-sm text-green-700 dark:text-green-300">
                    💡 {issue.suggestion}
                  </div>
                )}
              </div>
            ))}
            {issues.length > 5 && (
              <div className="text-center">
                <Button variant="outline">
                  View All {issues.length} Issues
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Viewer */}
      {selectedFile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>{selectedFile}</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLineNumbers(!showLineNumbers)}
                >
                  {showLineNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const file = files.find(f => f.name === selectedFile);
                    if (file) copyToClipboard(file.content);
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const file = files.find(f => f.name === selectedFile);
                    if (file) downloadFile(selectedFile, file.content);
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <pre className="text-sm font-mono">
                <code>
                  {(() => {
                    const file = files.find(f => f.name === selectedFile);
                    if (!file) return 'File not found';

                    return file.content.split('\n').map((line, index) => {
                      const lineNumber = index + 1;
                      const isIssueLine = issues.some(
                        issue => issue.file === selectedFile && issue.line === lineNumber
                      );

                      return (
                        <div
                          key={index}
                          className={`flex ${isIssueLine ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''}`}
                        >
                          {showLineNumbers && (
                            <span className="w-12 text-right text-muted-foreground pr-4 select-none">
                              {lineNumber}
                            </span>
                          )}
                          <span className={isIssueLine ? 'border-l-2 border-yellow-500 pl-2' : ''}>
                            {line || ' '}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </code>
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Files Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Files Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Files</TabsTrigger>
              <TabsTrigger value="issues">With Issues</TabsTrigger>
              <TabsTrigger value="clean">Clean</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-2">
                {files.map((file, index) => {
                  const fileIssues = issues.filter(issue => issue.file === file.name);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedFile(file.name)}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {file.language}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {fileIssues.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {fileIssues.length} issues
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {file.content.split('\n').length} lines
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="issues">
              <div className="space-y-2">
                {files
                  .filter(file => issues.some(issue => issue.file === file.name))
                  .map((file, index) => {
                    const fileIssues = issues.filter(issue => issue.file === file.name);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer border-red-200 dark:border-red-800"
                        onClick={() => setSelectedFile(file.name)}
                      >
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="font-medium">{file.name}</span>
                        </div>
                        <Badge variant="destructive">
                          {fileIssues.length} issues
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </TabsContent>

            <TabsContent value="clean">
              <div className="space-y-2">
                {files
                  .filter(file => !issues.some(issue => issue.file === file.name))
                  .map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer border-green-200 dark:border-green-800"
                      onClick={() => setSelectedFile(file.name)}
                    >
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium">{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {file.language}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">No issues</span>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
