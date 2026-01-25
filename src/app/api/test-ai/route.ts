import { NextResponse } from 'next/server';
import { AICodeAnalyzer } from '@/lib/ai-analyzer';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const hasAPIKey = !!process.env.ANTHROPIC_API_KEY;
    const isAIAvailable = AICodeAnalyzer.isAvailable();
    const apiKeyLength = process.env.ANTHROPIC_API_KEY?.length || 0;
    const apiKeyPrefix = process.env.ANTHROPIC_API_KEY?.substring(0, 15) || 'none';

    // Try to create analyzer instance
    let analyzerCreated = false;
    let testError: string | null = null;

    if (hasAPIKey) {
      try {
        // Test creating analyzer instance (we don't need to keep the instance)
        new AICodeAnalyzer(process.env.ANTHROPIC_API_KEY!);
        analyzerCreated = true;
      } catch (error) {
        testError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      hasAPIKey,
      isAIAvailable,
      apiKeyLength,
      apiKeyPrefix: apiKeyPrefix + '...',
      analyzerCreated,
      testError,
      message: hasAPIKey
        ? analyzerCreated
          ? '✅ AI Analyzer is ready!'
          : `❌ Failed to create analyzer: ${testError}`
        : '⚠️ ANTHROPIC_API_KEY not found in environment variables',
    });
  } catch (error) {
    logger.error('Test AI route error', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

