# Nawa Prativa School Management System

This is a Django-based school management system for Nawa Prativa School.

## Local Development Setup

1. Clone the repository
2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On macOS/Linux
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the project root (use `.env.example` as a template)
5. Run migrations:
   ```
   python manage.py migrate
   ```
6. Create a superuser:
   ```
   python manage.py createsuperuser
   ```
7. Run the development server:
   ```
   python manage.py runserver
   ```

## Deployment to Render

This project is configured for deployment on Render.com.

### Prerequisites

1. Create a Render account at https://render.com
2. Fork or clone this repository to your GitHub account

### Deployment Steps

1. In Render dashboard, click "New" and select "Blueprint"
2. Connect your GitHub repository
3. Render will automatically detect the `render.yaml` configuration
4. Review the settings and click "Apply"
5. Once deployed, you'll need to set up the following environment variables in the Render dashboard:
   - `ALLOWED_HOSTS`: Add your Render app URL (e.g., `your-app-name.onrender.com`)
   - Email settings: `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, etc.

### Manual Deployment (Alternative)

If you prefer to set up the services manually:

1. In Render dashboard, click "New" and select "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - Name: `nawaprativa-school` (or your preferred name)
   - Environment: `Python`
   - Build Command: `./build.sh`
   - Start Command: `gunicorn backend.wsgi:application`
4. Add environment variables as listed in `.env.example`
5. Create a PostgreSQL database in Render and link it to your web service

## Environment Variables

The following environment variables are used in this project:

- `SECRET_KEY`: Django secret key
- `DEBUG`: Set to `False` in production
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `DATABASE_URL`: PostgreSQL connection string
- `EMAIL_HOST`: SMTP server host
- `EMAIL_PORT`: SMTP server port
- `EMAIL_USE_TLS`: Whether to use TLS for email
- `EMAIL_HOST_USER`: Email username
- `EMAIL_HOST_PASSWORD`: Email password
- `DEFAULT_FROM_EMAIL`: Default sender email