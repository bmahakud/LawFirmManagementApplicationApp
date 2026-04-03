# Django Project Setup

A Django project with environment configuration, virtual environment, and git ignore.

## Project Structure

```
.
├── myproject/           # Django project settings
├── core/                # Main Django app
├── manage.py            # Django management script
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (local)
├── .env.example         # Environment variables template
├── .gitignore           # Git ignore rules
└── venv/                # Virtual environment
```

## Setup Instructions

### 1. Activate Virtual Environment

```bash
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Create .env File

Copy `.env.example` to `.env` and update with your settings:

```bash
cp .env.example .env
```

### 4. Run Migrations

```bash
python manage.py migrate
```

### 5. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
python manage.py runserver
```

The server will be available at `http://localhost:8000`

## Environment Variables

- `DEBUG`: Set to `False` in production
- `SECRET_KEY`: Change this to a secure random key in production
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `DB_ENGINE`: Database engine (default: sqlite3)
- `DB_NAME`: Database name or path

## Dependencies

- Django 4.2.11
- python-dotenv 1.0.0
- psycopg2-binary 2.9.9 (for PostgreSQL)
- gunicorn 21.2.0 (for production)

## Notes

- The `.env` file is ignored by git for security
- Use `.env.example` as a template for new environments
- Never commit `.env` to version control
