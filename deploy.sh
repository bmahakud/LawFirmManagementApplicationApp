#!/bin/bash
# Law Firm Management Application - Deployment Script
# Run this to deploy the latest changes: bash deploy.sh

set -e

# Use the script's directory as the base directory
REPO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "=== Pulling Latest Changes ==="
cd "$REPO_DIR"
# Remove conflicting untracked files if any
rm -f frontend/next-env.d.ts
git pull origin main

echo "=== Updating Backend ==="
if [ ! -d "$REPO_DIR/backend" ]; then
    echo "Error: Backend directory not found at $REPO_DIR/backend"
    exit 1
fi
cd "$REPO_DIR/backend"
source venv/bin/activate
pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py collectstatic --no-input
sudo systemctl restart gunicorn
deactivate

echo "=== Updating Frontend ==="
if [ ! -d "$REPO_DIR/frontend" ]; then
    echo "Error: Frontend directory not found at $REPO_DIR/frontend"
    exit 1
fi
cd "$REPO_DIR/frontend"
npm install
# npm run build (Disabled: building locally and pushing artifacts instead)
pm2 restart lawfirm-frontend

echo "=== DEPLOYMENT COMPLETE! ==="
