-- --------------------------------------------------------
-- SQL Script for NECN Smart College Information Chatbot
-- Target Database: MySQL 8.x
-- --------------------------------------------------------

CREATE DATABASE IF NOT EXISTS necn_chatbot_db;
USE necn_chatbot_db;

-- 1. Users Table (Administrators)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    contact_number VARCHAR(50),
    email VARCHAR(100),
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    department_id VARCHAR(50),
    email VARCHAR(100),
    contact VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. KnowledgeBase Table (Rules)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id VARCHAR(50) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    keywords TEXT NOT NULL, -- Stored as comma-separated strings for indexing
    synonyms TEXT,          -- Stored as comma-separated strings
    answer TEXT NOT NULL,
    related_department_id VARCHAR(50),
    priority INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'Active', -- Active / Inactive
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (related_department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FULLTEXT KEY ft_question_keywords (question, keywords, synonyms) -- Fulltext index for high-speed fallback lookup
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Chat Logs Table
CREATE TABLE IF NOT EXISTS chat_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_query TEXT NOT NULL,
    matched_rule_id VARCHAR(50),
    matched_question TEXT,
    match_score DOUBLE NOT NULL,
    user_role VARCHAR(50) NOT NULL, -- Student, Parent, Visitor, Faculty, Alumni
    fallback_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (matched_rule_id) REFERENCES knowledge_base(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Indexing for high-speed lookup optimization
-- --------------------------------------------------------
CREATE INDEX idx_rule_status ON knowledge_base(status);
CREATE INDEX idx_rule_priority ON knowledge_base(priority);
CREATE INDEX idx_chat_timestamp ON chat_logs(timestamp);
CREATE INDEX idx_chat_fallback ON chat_logs(fallback_triggered);

-- --------------------------------------------------------
-- Seed Initial Default Administrator Account (Password: Admin@NECN2026)
-- --------------------------------------------------------
INSERT INTO users (username, password_hash, full_name, email, role)
VALUES ('admin', '$2a$12$R9h/lSAbvI7265E9U1iZGuKz/Y7g8Qv3KOfuA4n6Q83xXfU0gT76y', 'NECN Chatbot Administrator', 'admin@necn.ac.in', 'ADMIN')
ON DUPLICATE KEY UPDATE username=username;
