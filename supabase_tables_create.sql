-- ========================================
-- MathComm Database Schema
-- Supabase SQL Editor에서 실행하세요
-- ========================================

-- 1. UUID Extension 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 2. problems 테이블 (메인 문제)
-- ========================================
CREATE TABLE IF NOT EXISTS problems (
  -- 기본 정보
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,  -- KaTeX 포맷
  solution TEXT,  -- KaTeX 포맷 (선택)
  
  -- 난이도 및 분류
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
  category_level1 INTEGER REFERENCES categories(category_id),  -- Level 1 ID (1-10)
  category_level2 INTEGER REFERENCES categories(category_id),  -- Level 2 ID (11-44)
  category_level3 INTEGER REFERENCES categories(category_id),  -- Level 3 ID (45-103)
  category_path TEXT,  -- 전체 경로: "Algebra > Elementary Algebra > Polynomials" (표시용)
  
  -- 추가 분류 (사용자 페이지용)
  level TEXT,  -- "Beginner", "Intermediate", "Advanced", "Olympiad"
  age_range TEXT,  -- "8-9", "9-11", "10-12", "11-13" 등
  xp INTEGER DEFAULT 0,  -- 문제 해결 시 획득 XP
  tags TEXT[],  -- 검색용 태그 배열
  
  -- 미디어
  diagram_image_url TEXT,  -- 도형/그래프 이미지 URL
  
  -- 문제 연결 (Learning Path)
  linked_problem_ids UUID[],  -- 연결된 문제 ID 배열
  parent_problem_id UUID REFERENCES problems(id),  -- 파생 문제의 경우 원본 문제
  
  -- AI 관련
  is_generated BOOLEAN DEFAULT false,  -- AI가 생성한 문제인지
  ai_confidence NUMERIC(3,2),  -- AI 난이도 예측 신뢰도 (0.00-1.00)
  concepts TEXT[],  -- 문제에 포함된 수학 개념들
  
  -- 메타데이터
  source TEXT,  -- 출처 (책, 웹사이트, MOEMS 등)
  license TEXT,  -- 라이선스 정보
  is_reviewed BOOLEAN DEFAULT false,  -- 관리자 검토 완료 여부
  reviewer_id UUID,  -- 검토자
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- problems 인덱스
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_category_level1 ON problems(category_level1);
CREATE INDEX IF NOT EXISTS idx_problems_level ON problems(level);
CREATE INDEX IF NOT EXISTS idx_problems_is_generated ON problems(is_generated);
CREATE INDEX IF NOT EXISTS idx_problems_parent ON problems(parent_problem_id);
CREATE INDEX IF NOT EXISTS idx_problems_created ON problems(created_at DESC);

-- ========================================
-- 3. users 테이블 (사용자 프로필)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  -- 기본 정보 (Supabase Auth와 연동)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT UNIQUE,
  
  -- 진행 상황
  current_level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  ranking_points INTEGER DEFAULT 0,  -- RP
  
  -- 등급 및 칭호
  tier TEXT DEFAULT 'Bronze',  -- Bronze, Silver, Gold, Diamond, Master
  title TEXT,  -- "The Curious Learner", "Euler Master" 등
  
  -- 스트릭
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- 통계
  problems_solved INTEGER DEFAULT 0,
  problems_attempted INTEGER DEFAULT 0,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- users 인덱스
CREATE INDEX IF NOT EXISTS idx_users_ranking_points ON users(ranking_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);

-- ========================================
-- 4. submissions 테이블 (제출 기록)
-- ========================================
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 관계
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  
  -- 제출 내용
  solution_text TEXT NOT NULL,  -- 사용자가 작성한 풀이 (Markdown/LaTeX)
  solution_html TEXT,  -- 렌더링된 HTML
  answer_value TEXT,  -- Auto-check용 답안
  
  -- 채점 결과
  status TEXT NOT NULL CHECK (status IN ('pending', 'correct', 'incorrect', 'partial')),
  score NUMERIC(5,2),  -- 0-100점
  xp_earned INTEGER DEFAULT 0,
  
  -- 피드백
  feedback TEXT,  -- AI 또는 관리자 피드백
  hints_used INTEGER DEFAULT 0,  -- 사용한 힌트 수
  xp_penalty INTEGER DEFAULT 0,  -- 힌트 사용으로 인한 XP 감점
  
  -- 메타데이터
  time_spent_seconds INTEGER,  -- 문제 해결에 걸린 시간
  attempt_number INTEGER DEFAULT 1,  -- 몇 번째 시도인지
  
  -- 타임스탬프
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- submissions 인덱스
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_user_problem ON submissions(user_id, problem_id, attempt_number);

-- ========================================
-- 5. user_progress 테이블 (사용자별 진행 상황)
-- ========================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 관계
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  
  -- 상태
  status TEXT NOT NULL CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed')),
  is_unlocked BOOLEAN DEFAULT false,
  
  -- 통계
  attempts INTEGER DEFAULT 0,
  best_score NUMERIC(5,2),
  completion_date TIMESTAMPTZ,
  
  -- 난이도 평가 (동적 난이도 조정용)
  user_difficulty_rating INTEGER CHECK (user_difficulty_rating >= 1 AND user_difficulty_rating <= 10),
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, problem_id)
);

-- user_progress 인덱스
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_problem ON user_progress(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_progress(status);

-- ========================================
-- 6. skill_tree 테이블 (스킬 트리/학습 경로)
-- ========================================
CREATE TABLE IF NOT EXISTS skill_tree (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 노드 정보
  node_id TEXT UNIQUE NOT NULL,  -- "magic-basics", "algebra-polynomials" 등
  label TEXT NOT NULL,
  description TEXT,
  
  -- 분류
  level TEXT NOT NULL,  -- "Beginner", "Intermediate" 등
  age_range TEXT,  -- "8-9", "9-11" 등
  category TEXT,  -- "Algebra", "Geometry" 등
  
  -- 위치 (시각화용)
  x_position INTEGER,
  y_position INTEGER,
  
  -- 연결된 문제들
  problem_ids UUID[],
  
  -- 선행 요건
  prerequisite_node_ids TEXT[],
  
  -- 활성화 조건
  xp_required INTEGER DEFAULT 0,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- skill_tree 인덱스
CREATE INDEX IF NOT EXISTS idx_skill_tree_level ON skill_tree(level);
CREATE INDEX IF NOT EXISTS idx_skill_tree_category ON skill_tree(category);

-- ========================================
-- 7. rankings 테이블 (랭킹)
-- ========================================
CREATE TABLE IF NOT EXISTS rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 관계
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 랭킹 정보
  ranking_type TEXT NOT NULL CHECK (ranking_type IN ('global', 'season', 'category', 'hall_of_fame')),
  rank INTEGER NOT NULL,
  points INTEGER NOT NULL,
  
  -- 시즌 정보 (해당되는 경우)
  season_id TEXT,  -- "2024-spring", "2024-fall" 등
  category TEXT,  -- 카테고리별 랭킹인 경우
  
  -- 칭호
  title TEXT,  -- "Euler Master", "First Conqueror" 등
  
  -- 타임스탬프
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, ranking_type, season_id, snapshot_date)
);

-- rankings 인덱스
CREATE INDEX IF NOT EXISTS idx_rankings_type ON rankings(ranking_type);
CREATE INDEX IF NOT EXISTS idx_rankings_season ON rankings(season_id);
CREATE INDEX IF NOT EXISTS idx_rankings_rank ON rankings(rank);

-- ========================================
-- 8. discussions 테이블 (토론/댓글)
-- ========================================
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 관계
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES discussions(id),  -- 대댓글
  
  -- 내용
  content TEXT NOT NULL,
  content_html TEXT,  -- 렌더링된 HTML (LaTeX 포함)
  
  -- 투표
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  
  -- 메타데이터
  is_solution_spoiler BOOLEAN DEFAULT false,  -- 스포일러 경고
  is_pinned BOOLEAN DEFAULT false,  -- 관리자가 고정한 댓글
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- discussions 인덱스
CREATE INDEX IF NOT EXISTS idx_discussions_problem ON discussions(problem_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user ON discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created ON discussions(created_at DESC);

-- ========================================
-- 9. problem_relationships 테이블 (문제 간 관계) ⭐
-- ========================================
CREATE TABLE IF NOT EXISTS problem_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 관계 정의
  source_problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,  -- 시작 문제
  target_problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,  -- 대상 문제
  
  -- 관계 타입
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'prerequisite',  -- 선행 문제
    'derived',       -- 파생 문제
    'related',       -- 관련 문제
    'next',          -- 다음 문제
    'alternative'    -- 대체 문제
  )),
  
  -- 순서 및 우선순위
  sequence_order INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  
  -- 관계 메타데이터
  strength NUMERIC(3,2) DEFAULT 0.5,  -- 관계 강도 (0.00-1.00)
  concept TEXT,  -- 연결하는 개념
  description TEXT,
  
  -- AI 생성 관계
  is_ai_generated BOOLEAN DEFAULT false,
  ai_confidence NUMERIC(3,2),
  
  -- 승인 상태
  is_approved BOOLEAN DEFAULT true,
  approved_by UUID,
  
  -- 통계
  success_rate NUMERIC(5,2),
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 중복 방지
  UNIQUE(source_problem_id, target_problem_id, relationship_type)
);

-- problem_relationships 인덱스
CREATE INDEX IF NOT EXISTS idx_relationships_source ON problem_relationships(source_problem_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON problem_relationships(target_problem_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON problem_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_sequence ON problem_relationships(source_problem_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_relationships_approved ON problem_relationships(is_approved);
CREATE INDEX IF NOT EXISTS idx_relationships_source_type ON problem_relationships(source_problem_id, relationship_type);

-- ========================================
-- 10. ai_generated_problems_temp 테이블 (AI 생성 문제 임시)
-- ========================================
CREATE TABLE IF NOT EXISTS ai_generated_problems_temp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 원본 문제
  parent_problem_id UUID REFERENCES problems(id),
  
  -- 생성된 문제 정보
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  solution TEXT,
  difficulty INTEGER,
  category_level1 INTEGER,
  category_level2 INTEGER,
  category_level3 INTEGER,
  concepts TEXT[],
  
  -- AI 메타데이터
  ai_model TEXT,  -- "gpt-4o", "gpt-4-turbo" 등
  generation_prompt TEXT,
  ai_confidence NUMERIC(3,2),
  
  -- 검토 상태
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  reviewer_notes TEXT,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ai_generated_problems_temp 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_temp_status ON ai_generated_problems_temp(review_status);
CREATE INDEX IF NOT EXISTS idx_ai_temp_parent ON ai_generated_problems_temp(parent_problem_id);

-- ========================================
-- ✅ 완료!
-- ========================================
-- 이제 RLS (Row Level Security) 정책을 설정하세요.
-- 다음 파일을 실행: supabase_rls_policies.sql

