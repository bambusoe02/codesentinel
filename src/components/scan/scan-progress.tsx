'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  Github,
  Code,
  Shield,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface ScanProgressProps {
  repoName: string;
  onComplete?: () => void;
}

const scanSteps = [
  {
    id: 'fetch',
    label: 'Fetching repository data',
    icon: Github,
  },
  {
    id: 'analyze',
    label: 'Analyzing code structure',
    icon: Code,
  },
  {
    id: 'security',
    label: 'Security assessment',
    icon: Shield,
  },
  {
    id: 'metrics',
    label: 'Calculating metrics',
    icon: TrendingUp,
  },
];

export function ScanProgress({ repoName, onComplete }: ScanProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkExisting = async () => {
      try {
        const response = await fetch(`/api/repositories/${encodeURIComponent(repoName)}/results`);
        if (response.ok && isMounted) {
          setIsComplete(true);
          setProgress(100);
          if (onComplete) {
            onComplete();
          }
          return;
        }
      } catch {
        // No existing analysis, continue to start new one
      }
      
      // Only start new analysis if component is still mounted and no existing analysis found
      if (isMounted) {
        runScan();
      }
    };

    const runScan = async () => {
      try {
        if (!isMounted) return;
        
        setProgress(10);
        setCurrentStep(0);
        
        // Start analysis
        const response = await fetch(`/api/repositories/${encodeURIComponent(repoName)}/analyze`, {
          method: 'POST',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start analysis');
        }

        // Simulate progress during analysis
        const steps = scanSteps.length;
        for (let i = 0; i < steps; i++) {
          if (!isMounted) return;
          
          setCurrentStep(i);
          const stepProgress = ((i + 1) / steps) * 90; // Reserve 10% for completion
          setProgress(stepProgress);
          
          // Wait a bit between steps
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!isMounted) return;

        setProgress(100);
        setCurrentStep(steps);
        setIsComplete(true);
        
        if (onComplete) {
          onComplete();
        }
      } catch (err) {
        if (!isMounted) return;
        
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setIsComplete(true);
      }
    };

    checkExisting();

    return () => {
      isMounted = false;
    };
  }, [repoName, onComplete]);

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                Analysis Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Analysis Complete!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Repository analysis finished successfully. View detailed results below.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStepData = scanSteps[currentStep];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Analyzing Repository</span>
          <Badge variant="secondary">{Math.round(progress)}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={progress} className="w-full" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentStepData && (
                <>
                  <currentStepData.icon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">
                    {currentStepData.label}
                  </span>
                </>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {scanSteps.length}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {scanSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center space-y-2 p-3 rounded-lg border ${
                    isCompleted
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : isCurrent
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-muted border-muted'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    isCompleted
                      ? 'bg-green-100 dark:bg-green-900'
                      : isCurrent
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'bg-muted'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Icon className={`w-4 h-4 ${
                        isCurrent
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-muted-foreground'
                      }`} />
                    )}
                  </div>
                  <span className={`text-xs text-center ${
                    isCompleted || isCurrent
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
