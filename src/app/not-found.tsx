import type { Viewport } from 'next'
import Link from 'next/link'

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
      <Link href="/dashboard" className="btn btn-primary">
        Back to Dashboard
      </Link>
    </div>
  )
}