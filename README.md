# JoyFund-PHIF

This is a full-stack platform built with Django REST Framework (backend) and Next.js (frontend). It manages campaigns, donations, beneficiaries, hospitals, and payment integrations (CamPay).

## Architecture
- Backend: Django/DRF, Celery, Redis, PostgreSQL (in Docker)
- Frontend: Next.js 15 (App Router, TypeScript), Tailwind CSS
- Payments: CamPay (Mobile Money/Card)
- Deployment: Docker Compose on VPS (Contabo)

## Local development

### Backend
`ash
cd backend
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
`

### Frontend
`ash
cd frontend
npm install
cp .env.example .env.local
npm run dev
`

## Deployment
Production deployment is handled via deploy.sh on the VPS. For local orchestration, see [DEPLOYMENT_LOCAL.md](DEPLOYMENT_LOCAL.md).

## Contributing
Follow existing conventions; commit messages should match repo style. See backend/AGENTS.md and frontend/AGENTS.md for detailed guidelines.

## License
Proprietary - All rights reserved.
