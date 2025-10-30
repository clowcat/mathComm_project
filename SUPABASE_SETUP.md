# Supabase Setup Guide

## 📋 목차
1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [데이터베이스 테이블 생성](#2-데이터베이스-테이블-생성)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [라이브러리 설치](#4-라이브러리-설치)
5. [테스트](#5-테스트)
6. [CSV Import/Export](#6-csv-importexport)

---

## 1. Supabase 프로젝트 생성

### 1.1. Supabase 계정 만들기
1. [https://supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 또는 이메일로 가입

### 1.2. 새 프로젝트 생성
1. Dashboard에서 "New project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: `mathcomm` (또는 원하는 이름)
   - **Database Password**: 안전한 비밀번호 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)` 추천
3. "Create new project" 클릭 (1-2분 소요)

### 1.3. API 키 확인
프로젝트 생성 후:
1. 좌측 메뉴에서 ⚙️ **Settings** → **API** 클릭
2. 필요한 값 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbG...` (공개 키)
   - **service_role**: `eyJhbG...` (비밀 키, 관리자용)

---

## 2. 데이터베이스 테이블 생성

### 2.1. SQL Editor로 이동
1. 좌측 메뉴에서 🔧 **SQL Editor** 클릭
2. "New query" 버튼 클릭

### 2.2. problems 테이블 생성

아래 SQL을 복사해서 실행하세요:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- problems 테이블 생성
CREATE TABLE problems (
  -- 기본 정보
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  solution TEXT,
  
  -- 난이도 및 분류
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
  category_level1 TEXT,
  category_level2 TEXT,
  category_level3 TEXT,
  category_path TEXT,
  
  -- 추가 분류
  level TEXT,
  age_range TEXT,
  xp INTEGER DEFAULT 0,
  tags TEXT[],
  
  -- 미디어
  diagram_image_url TEXT,
  
  -- 문제 연결
  linked_problem_ids UUID[],
  parent_problem_id UUID REFERENCES problems(id),
  
  -- AI 관련
  is_generated BOOLEAN DEFAULT false,
  ai_confidence NUMERIC(3,2),
  concepts TEXT[],
  
  -- 메타데이터
  source TEXT,
  license TEXT,
  is_reviewed BOOLEAN DEFAULT false,
  reviewer_id UUID,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (검색 속도 향상)
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_category ON problems(category_level1);
CREATE INDEX idx_problems_level ON problems(level);
CREATE INDEX idx_problems_created ON problems(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- 모두 읽기 가능하도록 정책 설정
CREATE POLICY "Anyone can view problems"
  ON problems FOR SELECT
  TO public
  USING (true);

-- 인증된 사용자는 문제 생성/수정 가능
CREATE POLICY "Authenticated users can insert problems"
  ON problems FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update problems"
  ON problems FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete problems"
  ON problems FOR DELETE
  TO authenticated
  USING (true);
```

### 2.3. 테스트 데이터 삽입 (선택사항)

```sql
-- 샘플 문제 1개 삽입
INSERT INTO problems (
  title, 
  content, 
  solution, 
  difficulty, 
  category_level1,
  category_path,
  level,
  xp
) VALUES (
  'Quadratic Equation Basics',
  'Solve the equation: \\( x^2 + 5x + 6 = 0 \\)',
  'Factoring: \\( (x+2)(x+3) = 0 \\), so \\( x = -2 \\) or \\( x = -3 \\)',
  3,
  'Algebra',
  'Algebra > Elementary Algebra > Equations',
  'Beginner',
  150
);

-- 확인
SELECT * FROM problems;
```

### 2.4. 추가 테이블 (향후 필요 시)

나중에 필요할 때 아래 테이블들을 생성하세요:

**users 테이블**: (Supabase Auth와 연동)
```sql
-- DATABASE_SCHEMA.md 파일 참고
```

**submissions, user_progress, rankings 등**: `DATABASE_SCHEMA.md` 참고

---

## 3. 환경 변수 설정

### 3.1. .env.local 파일 생성

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# OpenAI API (기존)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Supabase (새로 추가)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Environment
NODE_ENV=development
```

### 3.2. 실제 값으로 교체

Supabase Dashboard에서 복사한 값을 입력:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **주의**: `.env.local`은 절대 Git에 커밋하지 마세요!

---

## 4. 라이브러리 설치

터미널에서 실행:

```bash
npm install @supabase/supabase-js
```

권한 오류가 발생하면:

```bash
sudo chown -R $(whoami) ~/.npm
npm install @supabase/supabase-js
```

---

## 5. 테스트

### 5.1. 개발 서버 시작

```bash
npm run dev
```

### 5.2. Admin 페이지 확인

1. 브라우저에서 `http://localhost:3000` 접속
2. "Admin" 버튼 클릭 → `/admin/problems` 이동
3. 헤더에서 연결 상태 확인:
   - ✅ **초록색 배지 "Connected to Supabase"** → 성공!
   - ⚠️ **회색 배지 "Local Mode"** → 연결 실패

### 5.3. 연결 실패 시 체크리스트

❌ **"Local Mode"가 표시되면**:

1. **환경 변수 확인**
   ```bash
   # .env.local 파일이 프로젝트 루트에 있는지 확인
   ls -la .env.local
   
   # 내용 확인 (키가 올바른지)
   cat .env.local
   ```

2. **개발 서버 재시작**
   ```bash
   # Ctrl+C로 서버 종료 후
   npm run dev
   ```

3. **브라우저 콘솔 확인**
   - F12 → Console 탭
   - 빨간색 에러 메시지 확인

4. **Supabase API 키 재확인**
   - Dashboard → Settings → API
   - URL과 키가 정확한지 확인

---

## 6. CSV Import/Export

### 6.1. CSV Export (문제 다운로드)

Admin 페이지에서:

1. 필터 설정 (선택사항):
   - Category: "Algebra"
   - Difficulty: "Medium"
   - 검색어 입력

2. **"Export CSV"** 버튼 클릭

3. 다운로드된 파일:
   - 파일명: `mathcomm_problems_filtered_2025-10-30.csv`
   - 위치: 브라우저 다운로드 폴더
   - 형식: UTF-8 CSV (Excel에서 열기 가능)

### 6.2. CSV Import (Supabase에 업로드)

#### 방법 1: Supabase Dashboard 사용

1. Supabase Dashboard → **Table Editor** → `problems` 테이블
2. "Insert" → "Insert from CSV" 버튼
3. CSV 파일 선택 → "Import" 클릭

#### 방법 2: SQL로 직접 삽입

```sql
-- 예시: CSV 내용을 INSERT 문으로 변환
INSERT INTO problems (title, content, difficulty, category_level1)
VALUES 
  ('Problem 1', 'Content...', 5, 'Algebra'),
  ('Problem 2', 'Content...', 7, 'Geometry');
```

### 6.3. CSV 파일 구조

다운로드된 CSV는 다음 컬럼을 포함합니다:

```
ID, Title, Content, Solution, Difficulty, Difficulty Label, Category Level 1, Category Level 2, Category Level 3, ...
```

---

## 7. 문제 해결 (Troubleshooting)

### 문제: "Database not connected" 메시지

**해결**:
1. `.env.local` 파일이 있는지 확인
2. 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사)
3. 개발 서버 재시작

### 문제: CORS 에러

**해결**:
- Supabase는 기본적으로 CORS 허용
- 만약 발생하면 Dashboard → Authentication → URL Configuration 확인

### 문제: RLS 정책으로 인한 접근 거부

**해결**:
```sql
-- SQL Editor에서 실행
ALTER TABLE problems DISABLE ROW LEVEL SECURITY;
-- 또는 정책 수정
```

### 문제: CSV 한글 깨짐 (Excel)

**해결**:
1. CSV 파일을 메모장으로 열기
2. "다른 이름으로 저장" → 인코딩: UTF-8 with BOM
3. Excel에서 다시 열기

---

## 8. 다음 단계

### 8.1. 이미지 저장 설정

문제에 도형/그래프 이미지를 저장하려면:

1. Supabase Dashboard → **Storage** 클릭
2. "Create bucket" → `problem-images` 생성
3. Public 설정
4. 코드에서 이미지 업로드:

```typescript
import { supabase } from '@/lib/supabase';

const uploadImage = async (file: File) => {
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase
    .storage
    .from('problem-images')
    .upload(fileName, file);
  
  if (error) throw error;
  
  // Public URL 가져오기
  const { data: urlData } = supabase
    .storage
    .from('problem-images')
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
};
```

### 8.2. 사용자 인증 추가

나중에 사용자 로그인이 필요하면:

```typescript
// 회원가입
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// 로그인
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

---

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security (RLS) 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - 전체 DB 스키마

---

## ✅ 체크리스트

설정이 완료되었는지 확인하세요:

- [ ] Supabase 프로젝트 생성 완료
- [ ] `problems` 테이블 생성 완료
- [ ] `.env.local` 파일 생성 및 API 키 입력 완료
- [ ] `@supabase/supabase-js` 라이브러리 설치 완료
- [ ] 개발 서버에서 "Connected to Supabase" 확인
- [ ] 테스트 문제 1개 저장 성공
- [ ] CSV Export 테스트 완료

모두 체크되었다면 **Supabase 연결 완료**입니다! 🎉

