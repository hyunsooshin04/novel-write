-- 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 세션 테이블 (간단한 인증용)
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 소설 프로젝트 테이블
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    keywords TEXT,
    overview TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 세계관 설정 테이블
CREATE TABLE worldbuilding (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    background TEXT,
    history TEXT,
    mythology TEXT,
    rules TEXT,
    other_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 캐릭터 테이블
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    description TEXT,
    personality TEXT,
    background TEXT,
    appearance TEXT,
    other_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 에피소드/회차 테이블
CREATE TABLE episodes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title VARCHAR(255),
    prompt TEXT,
    content TEXT,
    min_word_count INTEGER DEFAULT 0,
    actual_word_count INTEGER DEFAULT 0,
    constraints TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, episode_number)
);

-- 인덱스 생성
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_worldbuilding_project_id ON worldbuilding(project_id);
CREATE INDEX idx_characters_project_id ON characters(project_id);
CREATE INDEX idx_episodes_project_id ON episodes(project_id);
CREATE INDEX idx_episodes_episode_number ON episodes(project_id, episode_number);
