# Database Schema for MathComm

## 📋 테이블 구조

### 1. **categories** (카테고리) ⭐ 기존 생성됨
수학 문제 카테고리 계층 구조 관리 (총 103개 카테고리)

```sql
CREATE TABLE categories (
  category_id INTEGER PRIMARY KEY,  -- 1, 2, 3, ... 103
  name TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
  parent_id INTEGER REFERENCES categories(category_id)
);

-- 인덱스
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- 실제 데이터 예시 (Level 1 - 10개)
-- 1: Algebra
-- 2: Geometry  
-- 3: Analysis
-- 4: Number Theory
-- 5: Combinatorics & Discrete Mathematics
-- 6: Probability & Statistics
-- 7: Optimization Theory
-- 8: Numerical Analysis
-- 9: Cryptography
-- 10: Game Theory

-- 실제 데이터 예시 (Level 2 - 34개)
-- 11: Elementary Algebra (parent: 1)
-- 12: Linear Algebra (parent: 1)
-- 13: Abstract Algebra (parent: 1)
-- 14: Euclidean Geometry (parent: 2)
-- 18: Calculus (parent: 3)
-- ... 등

-- 실제 데이터 예시 (Level 3 - 59개)
-- 45: Polynomials (parent: 11)
-- 46: Equations and Inequalities (parent: 11)
-- 47: Factorization (parent: 11)
-- 48: Exponents and Logarithms (parent: 11)
-- 68: Limits and Continuity (parent: 18)
-- 69: Differentiation (parent: 18)
-- 70: Integration (parent: 18)
-- ... 등

-- 전체 데이터는 categories_rows.csv 참고
```

### 카테고리 계층 구조 예시

```
1 (Algebra)
  ├─ 11 (Elementary Algebra)
  │    ├─ 45 (Polynomials)
  │    ├─ 46 (Equations and Inequalities)
  │    ├─ 47 (Factorization)
  │    └─ 48 (Exponents and Logarithms)
  ├─ 12 (Linear Algebra)
  │    ├─ 49 (Matrices and Determinants)
  │    ├─ 50 (Vector Spaces)
  │    ├─ 51 (Linear Transformations)
  │    └─ 52 (Eigenvalues and Eigenvectors)
  └─ 13 (Abstract Algebra)
       ├─ 53 (Group Theory)
       ├─ 54 (Ring Theory)
       ├─ 55 (Field Theory)
       └─ 56 (Galois Theory)

3 (Analysis)
  └─ 18 (Calculus)
       ├─ 68 (Limits and Continuity)
       ├─ 69 (Differentiation)
       ├─ 70 (Integration)
       └─ 71 (Series)
```

### 2. **problems** (문제)
메인 문제 테이블 - 모든 수학 문제 저장

```sql
CREATE TABLE problems (
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
  reviewer_id UUID REFERENCES auth.users(id),  -- 검토자
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 인덱스를 위한 컬럼
  search_vector TSVECTOR  -- 전문 검색용
);

-- 인덱스
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_category_level1 ON problems(category_level1);
CREATE INDEX idx_problems_level ON problems(level);
CREATE INDEX idx_problems_is_generated ON problems(is_generated);
CREATE INDEX idx_problems_parent ON problems(parent_problem_id);
CREATE INDEX idx_problems_search ON problems USING GIN(search_vector);
```

### 2. **users** (사용자)
Supabase Auth와 연동된 사용자 프로필

```sql
CREATE TABLE users (
  -- 기본 정보 (Supabase Auth와 연동)
  id UUID PRIMARY KEY REFERENCES auth.users(id),
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

-- 인덱스
CREATE INDEX idx_users_ranking_points ON users(ranking_points DESC);
CREATE INDEX idx_users_tier ON users(tier);
```

### 3. **submissions** (제출)
사용자의 문제 풀이 제출 기록

```sql
CREATE TABLE submissions (
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

-- 인덱스
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_problem ON submissions(problem_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE UNIQUE INDEX idx_submissions_user_problem ON submissions(user_id, problem_id, attempt_number);
```

### 4. **user_progress** (사용자 진행 상황)
특정 문제에 대한 사용자별 진행 상태

```sql
CREATE TABLE user_progress (
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

-- 인덱스
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_problem ON user_progress(problem_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
```

### 5. **skill_tree** (스킬 트리)
학습 경로 및 문제 연결 구조

```sql
CREATE TABLE skill_tree (
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

-- 인덱스
CREATE INDEX idx_skill_tree_level ON skill_tree(level);
CREATE INDEX idx_skill_tree_category ON skill_tree(category);
```

### 6. **rankings** (랭킹)
시즌별/전체 랭킹 기록

```sql
CREATE TABLE rankings (
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

-- 인덱스
CREATE INDEX idx_rankings_type ON rankings(ranking_type);
CREATE INDEX idx_rankings_season ON rankings(season_id);
CREATE INDEX idx_rankings_rank ON rankings(rank);
```

### 7. **discussions** (토론)
문제별 토론/댓글

```sql
CREATE TABLE discussions (
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

-- 인덱스
CREATE INDEX idx_discussions_problem ON discussions(problem_id);
CREATE INDEX idx_discussions_user ON discussions(user_id);
CREATE INDEX idx_discussions_created ON discussions(created_at DESC);
```

### 8. **problem_relationships** (문제 간 관계) ⭐ 중요
원 문제와 파생 문제, 선행 문제 등의 관계 저장

```sql
CREATE TABLE problem_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 관계 정의
  source_problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,  -- 시작 문제
  target_problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,  -- 대상 문제
  
  -- 관계 타입
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'prerequisite',  -- 선행 문제 (target을 풀기 전에 source를 먼저 풀어야 함)
    'derived',       -- 파생 문제 (source로부터 AI가 생성한 문제)
    'related',       -- 관련 문제 (같은 개념)
    'next',          -- 다음 문제 (학습 경로 순서)
    'alternative'    -- 대체 문제 (비슷한 난이도)
  )),
  
  -- 순서 및 우선순위
  sequence_order INTEGER DEFAULT 0,  -- 학습 경로에서의 순서
  priority INTEGER DEFAULT 0,        -- 추천 우선순위 (높을수록 우선)
  
  -- 관계 메타데이터
  strength NUMERIC(3,2) DEFAULT 0.5,  -- 관계 강도 (0.00-1.00)
  concept TEXT,                        -- 연결하는 개념 (예: "Quadratic Equations")
  description TEXT,                    -- 관계 설명
  
  -- AI 생성 관계
  is_ai_generated BOOLEAN DEFAULT false,
  ai_confidence NUMERIC(3,2),          -- AI가 제안한 관계의 신뢰도
  
  -- 승인 상태
  is_approved BOOLEAN DEFAULT true,    -- 관리자 승인 여부
  approved_by UUID REFERENCES auth.users(id),
  
  -- 통계
  success_rate NUMERIC(5,2),           -- 이 관계를 따라 학습한 사용자의 성공률
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 중복 방지
  UNIQUE(source_problem_id, target_problem_id, relationship_type)
);

-- 인덱스
CREATE INDEX idx_relationships_source ON problem_relationships(source_problem_id);
CREATE INDEX idx_relationships_target ON problem_relationships(target_problem_id);
CREATE INDEX idx_relationships_type ON problem_relationships(relationship_type);
CREATE INDEX idx_relationships_sequence ON problem_relationships(source_problem_id, sequence_order);
CREATE INDEX idx_relationships_approved ON problem_relationships(is_approved);

-- 관계 조회 최적화를 위한 복합 인덱스
CREATE INDEX idx_relationships_source_type ON problem_relationships(source_problem_id, relationship_type);
```

### 9. **ai_generated_problems_temp** (AI 생성 문제 임시 테이블)
관리자 검토 대기 중인 AI 생성 문제

```sql
CREATE TABLE ai_generated_problems_temp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 원본 문제
  parent_problem_id UUID REFERENCES problems(id),
  
  -- 생성된 문제 정보 (problems 테이블과 동일 구조)
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  solution TEXT,
  difficulty INTEGER,
  category_level1 TEXT,
  category_level2 TEXT,
  category_level3 TEXT,
  concepts TEXT[],
  
  -- AI 메타데이터
  ai_model TEXT,  -- "gpt-4o", "gpt-4-turbo" 등
  generation_prompt TEXT,  -- 사용된 프롬프트
  ai_confidence NUMERIC(3,2),
  
  -- 검토 상태
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  reviewer_notes TEXT,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_ai_temp_status ON ai_generated_problems_temp(review_status);
CREATE INDEX idx_ai_temp_parent ON ai_generated_problems_temp(parent_problem_id);
```

## 🔄 관계도

```
categories (계층 구조) ⭐ 103개 카테고리
  │
  ├──── (N) problems.category_level1 (INTEGER)
  ├──── (N) problems.category_level2 (INTEGER)
  └──── (N) problems.category_level3 (INTEGER)

users (1) ──── (N) submissions ──── (N) problems
  │                                      │
  │                                      │
  └──── (N) user_progress ──── (N) ────┘
                                         │
                                         │
problems ──── (N) discussions           │
  │                                      │
  ├──── (N) skill_tree (problem_ids)   │
  │                                      │
  ├──── (1) ai_generated_problems_temp │
  │                                      │
  └──── (N) problem_relationships ⭐    │
         ├── source_problem_id          │
         └── target_problem_id          │
                                         │
users (1) ──── (N) rankings             │
```

### 문제 간 관계 예시:

```
Original Problem (ID: A)
    │
    ├─[derived]──→ Derived Problem 1 (ID: B)
    ├─[derived]──→ Derived Problem 2 (ID: C)
    └─[derived]──→ Derived Problem 3 (ID: D)
    
Problem A (난이도 5)
    │
    ├─[prerequisite]──→ Problem E (난이도 3)  ← E를 먼저 풀어야 A 해금
    └─[next]──→ Problem F (난이도 7)          ← A를 풀면 F 추천
```

## 🎯 뷰 (Views) - 자주 사용하는 쿼리 최적화

### problems_enriched (통합 문제 뷰)
```sql
CREATE VIEW problems_enriched AS
SELECT 
  p.*,
  COUNT(DISTINCT s.user_id) as solvers_count,
  AVG(up.user_difficulty_rating) as avg_user_difficulty,
  COUNT(DISTINCT d.id) as discussion_count,
  COUNT(DISTINCT pr_derived.target_problem_id) as derived_problems_count,
  COUNT(DISTINCT pr_prereq.source_problem_id) as prerequisite_count
FROM problems p
LEFT JOIN submissions s ON p.id = s.problem_id AND s.status = 'correct'
LEFT JOIN user_progress up ON p.id = up.problem_id
LEFT JOIN discussions d ON p.id = d.problem_id
LEFT JOIN problem_relationships pr_derived ON p.id = pr_derived.source_problem_id AND pr_derived.relationship_type = 'derived'
LEFT JOIN problem_relationships pr_prereq ON p.id = pr_prereq.target_problem_id AND pr_prereq.relationship_type = 'prerequisite'
GROUP BY p.id;
```

### user_stats (사용자 통계 뷰)
```sql
CREATE VIEW user_stats AS
SELECT 
  u.*,
  COUNT(DISTINCT s.problem_id) FILTER (WHERE s.status = 'correct') as problems_solved,
  SUM(s.xp_earned) as total_xp_earned,
  AVG(s.score) as avg_score,
  RANK() OVER (ORDER BY u.ranking_points DESC) as global_rank
FROM users u
LEFT JOIN submissions s ON u.id = s.user_id
GROUP BY u.id;
```

### problem_learning_path (학습 경로 뷰)
```sql
CREATE VIEW problem_learning_path AS
SELECT 
  pr.source_problem_id,
  p_source.title as source_title,
  p_source.difficulty as source_difficulty,
  pr.relationship_type,
  pr.sequence_order,
  pr.target_problem_id,
  p_target.title as target_title,
  p_target.difficulty as target_difficulty,
  pr.concept,
  pr.strength
FROM problem_relationships pr
JOIN problems p_source ON pr.source_problem_id = p_source.id
JOIN problems p_target ON pr.target_problem_id = p_target.id
WHERE pr.is_approved = true
ORDER BY pr.source_problem_id, pr.sequence_order;
```

## 🔐 Row Level Security (RLS) 정책

```sql
-- users 테이블: 본인 데이터만 수정 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- problems 테이블: 모두 읽기 가능, 관리자만 수정 가능
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view problems"
  ON problems FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify problems"
  ON problems FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tier = 'Admin'
    )
  );
```

## 📊 데이터 변환 로직

### difficulty 숫자 → 문자열
```sql
CREATE FUNCTION get_difficulty_label(diff INTEGER) 
RETURNS TEXT AS $$
BEGIN
  CASE 
    WHEN diff <= 3 THEN RETURN 'Easy';
    WHEN diff <= 6 THEN RETURN 'Medium';
    WHEN diff <= 9 THEN RETURN 'Hard';
    WHEN diff = 10 THEN RETURN 'Olympiad';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### XP 계산
```sql
CREATE FUNCTION calculate_xp(diff INTEGER) 
RETURNS INTEGER AS $$
BEGIN
  RETURN diff * 50;  -- 난이도 1 = 50 XP, 10 = 500 XP
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

