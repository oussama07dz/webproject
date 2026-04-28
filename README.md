# Plateforme d'évaluation de la qualité - univ-biskra

Interactive web platform for Quality Assurance evaluation in higher education institutions.

## Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup Instructions

### 1. Database Setup

```bash
# Create database
createdb qa_platform

# Run schema
psql -d qa_platform -f database/schema.sql

# Run seed data
psql -d qa_platform -f database/seed.sql
```

### 2. Server Setup

```bash
cd server
npm install
# Update .env with your PostgreSQL credentials
npm start
```

Server will run on http://localhost:5000

### 3. Client Setup

```bash
cd client
npm install
npm run dev
```

Client will run on http://localhost:3000

## Default Users

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| recteur | recteur123 | Recteur |
| vrpd | vrpd123 | VRPD |
| vrpg | vrpg123 | VRPG |
| vrel | vrel123 | VRELEX |
| vrplan | vrplan123 | VRPlan |
| sg | sg123 | SG |
| doyen | doyen123 | Doyen |
| chef_dep | chef_dep123 | Chef de Département |

## Features

- Role-based authentication
- Domain → Champ → Reference → Questions hierarchy
- Yes/No answers with optional comment
- Multiple file uploads (PDF, DOC, Images, Excel)
- Admin approval/rejection workflow
- Notifications for rejected answers
- Statistics dashboard with charts
- Admin management of domains, champs, refs, questions, users

## Project Structure

```
qa-platform/
├── client/          # React frontend
├── server/          # Node.js backend
└── database/        # SQL files
```
