#!/bin/sh
set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║         🌍 Earth Link - Social Posts Application         ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Application is starting..."
echo "✅ Database: MySQL (${DB_HOST}:${DB_PORT})"
echo ""

# Wait a bit for MySQL to be fully ready (healthcheck ensures it's up)
echo "⏳ Waiting for database to be fully ready..."
sleep 2

echo ""
echo "🌐 Access the application at:"
echo ""
echo "   👉  http://localhost:3000"
echo ""
echo "📊 API Health Check:"
echo "   http://localhost:3000/api/health"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Start the Next.js server
exec node server.js
