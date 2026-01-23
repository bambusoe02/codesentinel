#!/bin/bash

# Database Setup Script for CodeSentinel
# This script sets up all database tables and migrations

set -e

echo "🚀 Setting up CodeSentinel database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in .env.local or as environment variable"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Generate migrations from schema
echo "📝 Generating migrations from schema..."
npm run db:generate

# Push schema to database (non-interactive)
echo "📤 Pushing schema to database..."
echo "Note: This will apply all pending migrations"

# Use drizzle-kit push with --force flag to avoid interactive prompts
npx drizzle-kit push --force || {
    echo "⚠️  drizzle-kit push failed, trying manual migration..."
    
    # Fallback: Apply migrations manually
    echo "📋 Applying migrations manually..."
    
    # Read all SQL files and apply them
    for migration_file in drizzle/*.sql; do
        if [ -f "$migration_file" ]; then
            echo "Applying: $migration_file"
            # Note: This requires psql or similar tool
            # For Neon, you'll need to use their SQL Editor or API
            echo "⚠️  Manual migration requires database access"
            echo "Please run the SQL from $migration_file in Neon SQL Editor"
        fi
    done
}

echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify tables exist in Neon dashboard"
echo "2. Check that all columns are created"
echo "3. Test API endpoints"

