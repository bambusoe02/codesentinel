import type { Viewport } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-6xl font-bold text-destructive mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-8">Repo not found</h2>
      <Button asChild>
        <Link href="/dashboard">
          Back to Dashboard
        </Link>
      </Button>
    </div>
  )
}