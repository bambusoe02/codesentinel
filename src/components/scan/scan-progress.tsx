'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Github,
  Code,
  Shield,
  TrendingUp,
} from 'lucide-react';

interface ScanProgressProps {
  repoName: string;
}

const scanSteps = [
  {
    id: 'fetch',
    label: 'Fetching repository data',
    icon: Github,
    duration: 2000,
  },
  {
    id: 'analyze',
    label: 'Analyzing code structure',
    icon: Code,
    duration: 3000,
  },
  {
    id: 'security',
    label: 'Security assessment',
    icon: Shield,
    duration: 2500,
  },
  {
    id: 'metrics',
    label: 'Calculating metrics',
    icon: TrendingUp,
    duration: 1500,
  },
];

export function ScanProgress({ repoName }: ScanProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const runScan = async () => {
      for (let i = 0; i < scanSteps.length; i++) {
        setCurrentStep(i);
        const step = scanSteps[i];

        // Animate progress for this step
        const stepProgress = 100 / scanSteps.length;
        const startProgress = i * stepProgress;

        for (let p = 0; p <= stepProgress; p += 2) {
          setProgress(startProgress + p);
          await new Promise(resolve => setTimeout(resolve, step.duration / (stepProgress / 2)));
        }

        // Wait a bit before next step
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setIsComplete(true);
      setProgress(100);
    };

    runScan();
  }, [repoName]);

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
