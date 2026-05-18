#!/bin/bash

# Script to dump production database from server
# Run this ON THE SERVER

echo "=== Dumping Production Database ==="

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set default values if not in .env
DB_NAME=${DB_NAME:-law_firm_db}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Output file with timestamp
DUMP_FILE="production_db_dump_$(date +%Y%m%d_%H%M%S).sql"

echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo "Output: $DUMP_FILE"
echo ""

# Dump the database
echo "Dumping database..."
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -f $DUMP_FILE

if [ $? -eq 0 ]; then
    echo "✓ Database dumped successfully to: $DUMP_FILE"
    echo ""
    echo "File size: $(du -h $DUMP_FILE | cut -f1)"
    echo ""
    echo "Next steps:"
    echo "1. Download this file to your local machine"
    echo "2. Run ./restore_local_db.sh $DUMP_FILE"
else
    echo "✗ Error dumping database"
    exit 1
fi
