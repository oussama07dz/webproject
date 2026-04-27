# QA Evaluation Platform - Project Plan

## Overview
Interactive web platform for Quality Assurance evaluation in higher education institutions.

---

## Tech Stack
- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL

---

## 1. Database Schema

```sql
-- DOMAINS
CREATE TABLE domains (
  id SERIAL PRIMARY KEY,
  domain_number INT UNIQUE,
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CHAMPS
CREATE TABLE champs (
  id SERIAL PRIMARY KEY,
  domain_id INT REFERENCES domains(id),
  champ_code VARCHAR(10),
  title TEXT,
  sort_order INT DEFAULT 0
);

-- REFERENCES
CREATE TABLE refs (
  id SERIAL PRIMARY KEY,
  champ_id INT REFERENCES champs(id),
  ref_code VARCHAR(20),
  title TEXT,
  description TEXT,
  sort_order INT DEFAULT 0
);

-- QUESTIONS
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  ref_id INT REFERENCES refs(id),
  question_code VARCHAR(20),
  question_text TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- QUESTION_ROLES
CREATE TABLE question_roles (
  question_id INT REFERENCES questions(id),
  role VARCHAR(50),
  PRIMARY KEY (question_id, role)
);

-- PROOFS
CREATE TABLE proofs (
  id SERIAL PRIMARY KEY,
  question_id INT REFERENCES questions(id),
  proof_text TEXT
);

-- USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  full_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ANSWERS
CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  question_id INT REFERENCES questions(id),
  user_id INT REFERENCES users(id),
  year INT NOT NULL,
  answer BOOLEAN,
  comment TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  admin_comment TEXT,
  reviewed_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(question_id, user_id, year)
);

-- UPLOADS
CREATE TABLE uploads (
  id SERIAL PRIMARY KEY,
  answer_id INT REFERENCES answers(id),
  filename VARCHAR(255),
  original_name VARCHAR(255),
  filepath VARCHAR(500),
  file_type VARCHAR(50),
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  answer_id INT REFERENCES answers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. File Structure

```
/qa-platform
├── /server
│   ├── /config
│   │   └── db.js
│   ├── /controllers
│   │   ├── authController.js
│   │   ├── domainController.js
│   │   ├── answerController.js
│   │   ├── uploadController.js
│   │   ├── adminController.js
│   │   └── notificationController.js
│   ├── /middleware
│   │   └── auth.js
│   ├── /routes
│   │   ├── auth.js
│   │   ├── domains.js
│   │   ├── answers.js
│   │   ├── uploads.js
│   │   └── admin.js
│   ├── /uploads
│   ├── server.js
│   └── package.json
│
├── /client
│   ├── /public
│   ├── /src
│   │   ├── /components
│   │   │   ├── /layout
│   │   │   ├── /auth
│   │   │   ├── /dashboard
│   │   │   ├── /evaluation
│   │   │   ├── /admin
│   │   │   └── /common
│   │   ├── /context
│   │   ├── /hooks
│   │   ├── /services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
└── /database
    ├── schema.sql
    └── seed.sql
```

---

## 3. Seeded Users

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| recteur | recteur123 | recteur |
| vrpd | vrpd123 | vrpd |
| vrpg | vrpg123 | vrpg |
| vrel | vrel123 | vrel |
| vrplan | vrplan123 | vrplan |
| sg | sg123 | sg |
| doyen | doyen123 | doyen |
| chef_dep | chef_dep123 | chef_dep |

---

## 4. API Endpoints

### Auth
- POST /api/auth/login
- GET /api/auth/me

### Domains/Champs/Refs/Questions
- GET /api/domains
- POST /api/domains
- GET /api/domains/:id/champs
- POST /api/champs
- POST /api/refs
- POST /api/questions
- POST /api/questions/:id/roles

### Evaluation (User)
- GET /api/evaluation/domains
- GET /api/evaluation/champs/:domainId
- GET /api/evaluation/refs/:champId
- GET /api/evaluation/questions/:refId
- POST /api/answers
- PUT /api/answers/:id
- GET /api/answers/my-answers

### Uploads
- POST /api/uploads
- DELETE /api/uploads/:id
- GET /api/uploads/:id/download

### Admin
- GET /api/admin/pending
- GET /api/admin/answers/:id
- PUT /api/admin/answers/:id/review
- GET /api/admin/users
- POST /api/admin/users

### Notifications
- GET /api/notifications
- PUT /api/notifications/:id/read
- PUT /api/notifications/read-all

### Statistics
- GET /api/stats/domain/:id/:year

---

## 5. User Flow

### Dashboard
1. User logs in → sees domains list with progress %
2. Click domain → see champs list with progress
3. Click champ → see references list with progress
4. Click reference → answer questions

### Question Page
- Breadcrumb: Domain > Champ > Reference > Question X/Y
- Show question text
- Optional comment field
- Yes/No answer buttons
- If Yes: Upload proof files (multiple allowed)
- Previous / Next (skip) / Confirm buttons (top + bottom)
- After confirm: Show answered, Edit button appears
- Cannot edit if status is "approved"
- Can delete own files if not approved

### After Completing Reference
- Return to references list
- Continue with next reference or champ

---

## 6. Admin Flow

### Admin Dashboard
- Overview stats: pending reviews, total users, etc.

### Navigation
- Domains → Champs → References → Questions
- Users management
- Answer Review

### Review Process
1. View pending answers list
2. Click answer → see question, user's answer, uploaded files
3. Download files to verify
4. Approve or Reject
5. If Reject: add comment → notification sent to user

---

## 7. Answer Status Flow

```
(empty) → Confirm → pending
pending → Admin Approve → approved (locked)
pending → Admin Reject → rejected (user can edit)
rejected → User Edit → pending
```

---

## 8. Notifications

- When admin rejects: create notification for user
- User sees: "Your answer for [Question] has been rejected. Reason: [admin_comment]"
- Click → Navigate to that answer

---

## 9. File Upload Rules

- **Storage:** /uploads folder on server
- **Naming:** {answer_id}_{timestamp}_{original_name}
- **Max size:** 10MB
- **Allowed types:** PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, XLS, XLSX

---

## 10. Implementation Phases

| Phase | Tasks |
|-------|-------|
| 1 | PostgreSQL setup + schema |
| 2 | Node.js server + JWT auth |
| 3 | React + Tailwind setup |
| 4 | User dashboard (domains list) |
| 5 | Evaluation flow (champ → ref → questions) |
| 6 | File upload handling |
| 7 | Admin CRUD (domains, champs, refs, questions) |
| 8 | Admin review workflow |
| 9 | Notifications |
| 10 | Statistics |
| 11 | Testing & Polish |

---

## 11. Domain 5 Structure (Seed Data)

### CHAMP V1: ACCUEIL ET PRISE EN CHARGE
- V1.1: Dispositif d'accueil, orientation, information
- V1.2: Dispositif de communication

### CHAMP V2: QUALITÉ DE VIE
- V2.1: Accompagnement social
- V2.2: Service santé
- V2.3: Hygiène, Sécurité, Environnement

### CHAMP V3: ACTIVITÉS CULTURELLES ET SPORTIVES
- V3.1: Stratégie culturelle/sportive
- V3.2: Associations et clubs

---

*Generated: 28-03-2026*
