#!/bin/bash

# CodeSentinel Production Setup Script
# This script helps automate the production database setup

set -e

echo "🚀 CodeSentinel Production Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set as environment variable${NC}"
    echo ""
    echo "Please set DATABASE_URL:"
    echo "  export DATABASE_URL='postgresql://user:password@host/database'"
    echo ""
    echo "Or create .env.local file with:"
    echo "  DATABASE_URL=postgresql://..."
    echo ""
    read -p "Do you want to enter DATABASE_URL now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter DATABASE_URL: " DATABASE_URL
        export DATABASE_URL
    else
        echo -e "${RED}❌ DATABASE_URL is required. Exiting.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
echo ""

# Generate ENCRYPTION_KEY if not set
if [ -z "$ENCRYPTION_KEY" ]; then
    echo -e "${YELLOW}⚠️  ENCRYPTION_KEY not set${NC}"
    GENERATED_KEY=$(openssl rand -base64 32)
    echo ""
    echo "Generated ENCRYPTION_KEY:"
    echo -e "${GREEN}${GENERATED_KEY}${NC}"
    echo ""
    echo "⚠️  IMPORTANT: Save this key! You'll need it for Vercel environment variables."
    echo ""
    read -p "Do you want to use this key? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        export ENCRYPTION_KEY="$GENERATED_KEY"
        echo -e "${GREEN}✅ ENCRYPTION_KEY is set${NC}"
    else
        echo -e "${YELLOW}⚠️  You'll need to set ENCRYPTION_KEY manually${NC}"
    fi
    echo ""
else
    echo -e "${GREEN}✅ ENCRYPTION_KEY is already set${NC}"
    echo ""
fi

# Push database schema
echo "📦 Pushing database schema to Neon..."
echo ""

if npm run db:push; then
    echo ""
    echo -e "${GREEN}✅ Database schema pushed successfully!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Failed to push database schema${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. Check if DATABASE_URL is correct"
    echo "  2. Check if database is accessible"
    echo "  3. Check if you have write permissions"
    exit 1
fi

# Verify tables
echo "🔍 Verifying database tables..."
echo ""

TABLES=$(psql "$DATABASE_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null || echo "")

if [[ $TABLES == *"users"* ]] && [[ $TABLES == *"repositories"* ]] && [[ $TABLES == *"analysis_reports"* ]]; then
    echo -e "${GREEN}✅ All required tables exist:${NC}"
    echo "$TABLES" | grep -E "(users|repositories|analysis_reports|repository_metrics)" | sed 's/^/  - /'
    echo ""
else
    echo -e "${YELLOW}⚠️  Some tables might be missing. Please verify in Neon Dashboard.${NC}"
    echo ""
fi

# Summary
echo "=================================="
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Add environment variables to Vercel:"
echo "   - DATABASE_URL: (already set)"
if [ -n "$ENCRYPTION_KEY" ]; then
    echo -e "   - ENCRYPTION_KEY: ${GREEN}${ENCRYPTION_KEY}${NC}"
else
    echo "   - ENCRYPTION_KEY: (generate with: openssl rand -base64 32)"
fi
echo "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: (from Clerk Dashboard)"
echo "   - CLERK_SECRET_KEY: (from Clerk Dashboard - PRODUCTION keys!)"
echo ""
echo "2. Configure Clerk:"
echo "   - Switch to Production environment"
echo "   - Add Vercel domain to Allowed Origins"
echo "   - Configure GitHub OAuth with correct scopes"
echo ""
echo "3. Redeploy on Vercel:"
echo "   - Push to main branch, or"
echo "   - Manually redeploy from Vercel Dashboard"
echo ""

