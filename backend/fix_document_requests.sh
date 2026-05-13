#!/bin/bash
# Fix script for document request API 500 errors

echo "=== Document Request API Fix Script ==="
echo ""

# Check if we're in the backend directory
if [ ! -f "manage.py" ]; then
    echo "❌ Error: manage.py not found. Please run this script from the backend directory."
    exit 1
fi

echo "1. Checking Django setup..."
python manage.py check
if [ $? -ne 0 ]; then
    echo "❌ Django check failed!"
    exit 1
fi
echo "✓ Django check passed"
echo ""

echo "2. Checking if migrations exist..."
python manage.py showmigrations cases | grep casedocumentrequest
echo ""

echo "3. Running migrations..."
python manage.py migrate cases
if [ $? -ne 0 ]; then
    echo "❌ Migration failed!"
    exit 1
fi
echo "✓ Migrations applied"
echo ""

echo "4. Verifying table exists..."
python manage.py shell -c "from cases.models import CaseDocumentRequest; print(f'✓ Table: {CaseDocumentRequest.objects.model._meta.db_table}'); print(f'✓ Record count: {CaseDocumentRequest.objects.count()}')"
echo ""

echo "5. Testing imports..."
python -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings'); django.setup(); from cases.models import CaseDocumentRequest; from cases.views_document_requests import CaseDocumentRequestViewSet; from cases.serializers_document_requests import CaseDocumentRequestSerializer; print('✓ All imports successful')"
echo ""

echo "6. Verifying URL routing..."
python manage.py shell -c "from django.urls import reverse; print(f'✓ URL: {reverse(\"case-document-request-list\")}')"
echo ""

echo "=== Fix Complete ==="
echo ""
echo "The document request API should now be available at:"
echo "  /api/cases/document-requests/"
echo ""
echo "If you're still getting 500 errors, check your server logs:"
echo "  - For development: Check the Django console output"
echo "  - For production: Check gunicorn/uwsgi logs"
echo "  - Check nginx error logs if using nginx"
