import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/scan(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // Get the response (Clerk handles redirects internally)
  const response = NextResponse.next()

  // Add security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Only add CSP in production to avoid breaking development
  // Note: CSP must allow Clerk domains for authentication to work
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline' https://*.clerk.com; img-src 'self' data: https: https://*.clerk.com; font-src 'self' data: https://*.clerk.com; connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.github.com https://api.anthropic.com; frame-src https://*.clerk.com https://*.clerk.accounts.dev;"
    )
  }

  return response
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}