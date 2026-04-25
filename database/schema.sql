-- QA Evaluation Platform Database Schema

-- DOMAINS
CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    domain_number INT UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CHAMPS
CREATE TABLE champs (
    id SERIAL PRIMARY KEY,
    domain_id INT REFERENCES domains(id) ON DELETE CASCADE,
    champ_code VARCHAR(10) NOT NULL,
    title TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

-- REFERENCES
CREATE TABLE refs (
    id SERIAL PRIMARY KEY,
    champ_id INT REFERENCES champs(id) ON DELETE CASCADE,
    ref_code VARCHAR(20) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0
);

-- QUESTIONS
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    ref_id INT REFERENCES refs(id) ON DELETE CASCADE,
    question_code VARCHAR(20) NOT NULL,
    question_text TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

-- QUESTION_ROLES
CREATE TABLE question_roles (
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (question_id, role)
);

-- PROOFS
CREATE TABLE proofs (
    id SERIAL PRIMARY KEY,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    proof_text TEXT NOT NULL
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
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
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
    answer_id INT REFERENCES answers(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    answer_id INT REFERENCES answers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_champs_domain ON champs(domain_id);
CREATE INDEX idx_refs_champ ON refs(champ_id);
CREATE INDEX idx_questions_ref ON questions(ref_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_user ON answers(user_id);
CREATE INDEX idx_uploads_answer ON uploads(answer_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
