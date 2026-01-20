'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const dynamic = 'force-dynamic';

async function fetchGitHubTokenStatus() {
  const response = await fetch('/api/user/github-token');
  if (!response.ok) {
    throw new Error('Failed to fetch GitHub token status');
  }
  return response.json();
}

async function saveGitHubToken(token: string) {
  const response = await fetch('/api/user/github-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ githubToken: token }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save GitHub token');
  }
  return response.json();
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  const { data: tokenStatus, isLoading } = useQuery({
    queryKey: ['githubTokenStatus'],
    queryFn: fetchGitHubTokenStatus,
  });

  const saveMutation = useMutation({
    mutationFn: saveGitHubToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['githubTokenStatus'] });
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      return;
    }
    saveMutation.mutate(token.trim());
    setToken('');
    setShowToken(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your GitHub integration and preferences
        </p>
      </div>

      {/* GitHub Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Github className="w-5 h-5" />
            <CardTitle>GitHub Integration</CardTitle>
          </div>
          <CardDescription>
            Your GitHub token is automatically synchronized when you sign in with GitHub OAuth.
            You can also add a manual token as a fallback option.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          {isLoading ? (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <>
              {tokenStatus?.hasToken ? (
                <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    GitHub token is configured and active.
                    {tokenStatus?.githubUsername && (
                      <span className="block mt-1 text-sm">
                        Username: <strong>{tokenStatus.githubUsername}</strong>
                      </span>
                    )}
                    <span className="block mt-1 text-xs text-green-700 dark:text-green-300">
                      Token is automatically synchronized from your GitHub OAuth session and securely encrypted.
                    </span>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                    No GitHub token configured. Token will be automatically synchronized when you sign in with GitHub OAuth.
                    Alternatively, you can manually add a Personal Access Token below as a fallback option.
                  </AlertDescription>
                </Alert>
              )}

              {/* Token Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <Input
                        id="github-token"
                        type={showToken ? 'text' : 'password'}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        disabled={saveMutation.isPending}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowToken(!showToken)}
                      disabled={!token}
                    >
                      {showToken ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> This is optional. Your token is automatically synchronized from GitHub OAuth.
                    <br />
                    If you need to add a manual token, create one at{' '}
                    <a
                      href="https://github.com/settings/tokens?type=beta"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                    >
                      GitHub Settings
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                    . Required scopes: <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">repo</code>, <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">read:user</code>
                  </p>
                </div>

                {saveMutation.isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {saveMutation.error instanceof Error
                        ? saveMutation.error.message
                        : 'Failed to save GitHub token'}
                    </AlertDescription>
                  </Alert>
                )}

                {saveMutation.isSuccess && (
                  <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      GitHub token saved successfully! Your repositories should now be accessible.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={!token.trim() || saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : tokenStatus?.hasToken ? (
                    'Update Token'
                  ) : (
                    'Save Token'
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Create a GitHub Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Go to{' '}
              <a
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                GitHub Personal Access Tokens
              </a>
            </li>
            <li>Click &quot;Generate new token&quot; → &quot;Generate new token (classic)&quot;</li>
            <li>Give it a name (e.g., &quot;CodeSentinel&quot;)</li>
            <li>Select expiration (recommended: 90 days or custom)</li>
            <li>Check the following scopes:
              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                <li><code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">repo</code> - Full control of private repositories</li>
                <li><code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">read:user</code> - Read user profile data</li>
              </ul>
            </li>
            <li>Click &quot;Generate token&quot;</li>
            <li>Copy the token immediately (you won&apos;t see it again!)</li>
            <li>Paste it in the form above</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

