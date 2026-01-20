#!/bin/bash

# Generate .env.local template with all required variables

cat > .env.local << 'EOF'
# Clerk Authentication (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Neon Database
DATABASE_URL=postgresql://user:password@host/database

# Encryption Key (required for secure token storage)
# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=

# Optional: Fallback GitHub Token (if not using OAuth)
# GITHUB_TOKEN=ghp_...

EOF

echo "✅ Created .env.local template"
echo ""
echo "Next steps:"
echo "1. Fill in your values"
echo "2. Generate ENCRYPTION_KEY: openssl rand -base64 32"
echo "3. Run: chmod 600 .env.local (for security)"
echo ""

