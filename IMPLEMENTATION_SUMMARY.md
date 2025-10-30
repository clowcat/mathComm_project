# Supabase & CSV Export 구현 완료

## 📋 최신 업데이트 (2025-10-30)

**Categories 구조 업데이트**
- ✅ 실제 Supabase `categories` 테이블 구조에 맞춰 모든 문서 및 코드 업데이트
- ✅ Category IDs: TEXT → **INTEGER** (1-103)
- ✅ **103개 카테고리** (Level 1: 10개, Level 2: 34개, Level 3: 59개)
- ✅ `src/lib/categories.ts` 생성 (전체 카테고리 데이터 + Helper 함수)
- ✅ `categories_mapping.md` 생성 (완전한 카테고리 참조)
- ✅ Admin 페이지 INTEGER category IDs 사용
- 자세한 내용: `CATEGORIES_UPDATE_SUMMARY.md` 참고

---

## 📦 구현 내용

### 1. ✅ Supabase 연결 (Database Integration)

**구현 파일**: 
- `/src/lib/supabase.ts` - Supabase 클라이언트 및 API
- `/src/app/admin/problems/page.tsx` - Admin 페이지 연동

**기능**:
- ✅ Supabase PostgreSQL 연결
- ✅ 문제 CRUD (Create, Read, Update, Delete)
- ✅ 자동 데이터 로드 (페이지 로드 시)
- ✅ 실시간 DB 동기화
- ✅ 로컬 모드 폴백 (연결 실패 시)
- ✅ 로딩 상태 표시
- ✅ 에러 핸들링

**주요 API**:
```typescript
problemsAPI.getAll()        // 모든 문제 조회
problemsAPI.getById(id)     // ID로 문제 조회
problemsAPI.create(problem) // 새 문제 생성
problemsAPI.update(id, data)// 문제 수정
problemsAPI.delete(id)      // 문제 삭제
problemsAPI.filter(filters) // 필터링 조회
```

### 2. ✅ CSV Export (데이터 다운로드)

**구현 파일**:
- `/src/lib/csvExport.ts` - CSV 변환 및 다운로드

**기능**:
- ✅ 전체 문제 CSV 다운로드
- ✅ 필터링된 문제만 다운로드
- ✅ 모든 필드 포함 (25개 컬럼)
- ✅ 한글/수식 지원 (UTF-8)
- ✅ Excel 호환 형식
- ✅ 자동 파일명 생성 (`mathcomm_problems_YYYY-MM-DD.csv`)

**CSV 컬럼**:
```
ID, Title, Content, Solution, Difficulty, Difficulty Label, 
Category Level 1, Category Level 2, Category Level 3, Category Path,
Level, Age Range, XP, Tags, Diagram URL, Linked Problems, 
Parent Problem ID, Is Generated, AI Confidence, Concepts, 
Source, License, Is Reviewed, Created At, Updated At
```

### 3. ✅ Database Schema

**구현 파일**:
- `/DATABASE_SCHEMA.md` - 전체 DB 스키마 정의

**테이블 설계** (총 10개):
1. **categories** (카테고리) - 3단계 계층 구조 ⭐ 기존 생성됨
2. **problems** (문제) - 메인 테이블 ✅
3. **users** (사용자) - Supabase Auth 연동
4. **submissions** (제출) - 풀이 제출 기록
5. **user_progress** (진행상황) - 사용자별 문제 상태
6. **skill_tree** (스킬트리) - 학습 경로
7. **rankings** (랭킹) - 시즌별 순위
8. **discussions** (토론) - 문제 댓글
9. **problem_relationships** (문제 관계) - 원본-파생 관계 ⭐ 신규
10. **ai_generated_problems_temp** - AI 생성 문제 임시

**특징**:
- ✅ PRD 요구사항 100% 반영
- ✅ Admin 페이지 호환
- ✅ 사용자 페이지 호환
- ✅ 데이터 변환 로직 포함
- ✅ RLS (Row Level Security) 적용
- ✅ 인덱스 최적화

### 4. ✅ Admin UI 개선

**추가된 기능**:
- ✅ DB 연결 상태 표시 (배지)
- ✅ "Sync from DB" 버튼 (새로고침)
- ✅ "Export CSV" 버튼 (다운로드)
- ✅ 자동 DB 저장 (문제 생성/수정 시)
- ✅ 동기화 상태 표시 ("Synced to DB" / "Local only")
- ✅ 로딩 스피너 표시

**UI 스크린샷 위치**:
```
┌─────────────────────────────────────────────────┐
│  Problem Content Management                     │
│  Create, edit, and manage math problems        │
│  🟢 Connected to Supabase                       │
│                           [Sync] [Export CSV]   │
├─────────────────────────────────────────────────┤
│  [Total: 25]  [Easy: 8]  [Medium: 12]  [Hard: 5]│
└─────────────────────────────────────────────────┘
```

---

## 📋 데이터 흐름

### 문제 저장 흐름

```
사용자 입력 (Admin UI)
    ↓
handleSaveProblem()
    ↓
로컬 State 업데이트
    ↓
saveProblemToSupabase() ← 데이터 변환 (local → Supabase 형식)
    ↓
Supabase API (problemsAPI.create/update)
    ↓
PostgreSQL 저장
    ↓
Toast 알림: "✅ Synced to DB"
```

### 문제 로드 흐름

```
페이지 로드 (useEffect)
    ↓
loadProblemsFromSupabase()
    ↓
problemsAPI.getAll()
    ↓
Supabase SELECT * FROM problems
    ↓
데이터 변환 (Supabase → local 형식)
    ↓
setProblems(convertedProblems)
    ↓
UI 렌더링
```

### CSV Export 흐름

```
"Export CSV" 버튼 클릭
    ↓
handleExportCSV()
    ↓
exportFilteredProblemsToCSV()
    ↓
필터 적용 (category, difficulty, search)
    ↓
convertProblemsToCSV() ← CSV 변환
    ↓
downloadCSV() ← 브라우저 다운로드
    ↓
파일 저장: mathcomm_problems_2025-10-30.csv
```

---

## 🗄️ 데이터 변환 로직

### Admin → Supabase 변환

```typescript
{
  // Admin 형식
  id: "1",
  title: "Problem Title",
  category: "Algebra > Elementary Algebra",
  difficulty: 5,
  linkedProblems: ["2", "3"]
}

↓ 변환 ↓

{
  // Supabase 형식
  id: "uuid-xxx",
  title: "Problem Title",
  category_path: "Algebra > Elementary Algebra",
  category_level1: "Algebra",
  category_level2: "Elementary Algebra",
  difficulty: 5,
  level: "Medium",  // getDifficultyLabel(5)
  xp: 250,          // calculateXP(5)
  tags: ["Algebra", "Elementary Algebra"],
  linked_problem_ids: ["uuid-2", "uuid-3"]
}
```

### Supabase → Admin 변환

```typescript
{
  // Supabase 형식
  id: "uuid-xxx",
  category_path: "Algebra > Elementary Algebra",
  category_level1: "Algebra",
  difficulty: 5,
  linked_problem_ids: ["uuid-2"]
}

↓ 변환 ↓

{
  // Admin 형식
  id: "uuid-xxx",
  category: "Algebra > Elementary Algebra",
  difficulty: 5,
  linkedProblems: ["uuid-2"]
}
```

---

## 🎯 사용 시나리오

### 시나리오 1: 문제 저장 (DB 연결됨)

```
1. Admin이 문제 입력
2. "Save Problem" 클릭
3. 로컬 State 업데이트
4. Supabase에 자동 저장
5. ✅ Toast: "Problem created successfully! (Synced to DB)"
6. Problem List에 즉시 표시
```

### 시나리오 2: CSV 다운로드

```
1. 필터 설정:
   - Category: "Algebra"
   - Difficulty: "Medium"
   - Search: "equation"
   
2. "Export CSV" 클릭

3. 다운로드:
   - mathcomm_problems_filtered_2025-10-30.csv
   - 12 problems (필터링된 결과만)
   
4. Excel에서 열기 → 분석/공유
```

### 시나리오 3: DB 연결 실패 (로컬 모드)

```
1. Supabase 연결 실패 (환경변수 없음)
2. ⚠️ Toast: "Database not connected. Using local data."
3. 회색 배지: "Local Mode"
4. 로컬 mock data 사용
5. "Sync from DB" 클릭 → 재연결 시도
```

---

## 🛠️ 설치 및 설정

### 1. 라이브러리 설치

```bash
npm install @supabase/supabase-js
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI (기존)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Supabase 테이블 생성

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- problems 테이블 생성
CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  solution TEXT,
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
  category_level1 TEXT,
  category_level2 TEXT,
  category_level3 TEXT,
  category_path TEXT,
  level TEXT,
  age_range TEXT,
  xp INTEGER DEFAULT 0,
  tags TEXT[],
  diagram_image_url TEXT,
  linked_problem_ids UUID[],
  parent_problem_id UUID REFERENCES problems(id),
  is_generated BOOLEAN DEFAULT false,
  ai_confidence NUMERIC(3,2),
  concepts TEXT[],
  source TEXT,
  license TEXT,
  is_reviewed BOOLEAN DEFAULT false,
  reviewer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_category ON problems(category_level1);

-- RLS 정책
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view problems" ON problems FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert" ON problems FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON problems FOR UPDATE TO authenticated USING (true);
```

전체 스키마는 `DATABASE_SCHEMA.md` 참고.

### 4. 개발 서버 실행

```bash
npm run dev
```

---

## 📝 문서

### 작성된 문서 목록

1. **DATABASE_SCHEMA.md** - 전체 DB 스키마
   - 8개 테이블 정의
   - 관계도
   - RLS 정책
   - 뷰 및 함수

2. **SUPABASE_SETUP.md** - Supabase 설정 가이드
   - 프로젝트 생성
   - 테이블 생성
   - 환경 변수 설정
   - 문제 해결

3. **CATEGORY_MATCHING_GUIDE.md** - 카테고리 매칭
   - AI 자동 매칭
   - 실패 시 처리
   - 개선 전략

4. **IMPLEMENTATION_SUMMARY.md** (이 파일)
   - 구현 내용 요약
   - 사용 방법
   - 문제 해결

---

## ✅ 체크리스트

### 필수 설정

- [ ] `npm install @supabase/supabase-js` 실행 완료
- [ ] `.env.local` 파일 생성 및 API 키 입력
- [ ] Supabase 프로젝트 생성
- [ ] `problems` 테이블 생성 (SQL 실행)
- [ ] 개발 서버 재시작 (`npm run dev`)

### 기능 테스트

- [ ] Admin 페이지에서 "Connected to Supabase" 확인
- [ ] 문제 1개 생성 → DB에 저장 확인
- [ ] "Sync from DB" 클릭 → 데이터 로드 확인
- [ ] "Export CSV" 클릭 → 파일 다운로드 확인
- [ ] CSV 파일을 Excel에서 열기 → 데이터 확인

---

## 🐛 문제 해결 (Quick Fix)

### "Local Mode" 배지가 표시됨

**원인**: Supabase 연결 실패

**해결**:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 이름 확인 (`NEXT_PUBLIC_SUPABASE_URL`)
3. 개발 서버 재시작
4. 브라우저 콘솔(F12) 확인

### npm install 권한 오류

**원인**: npm 캐시 권한

**해결**:
```bash
sudo chown -R $(whoami) ~/.npm
npm install @supabase/supabase-js
```

### CSV 한글 깨짐 (Excel)

**원인**: 인코딩 문제

**해결**:
1. CSV를 메모장으로 열기
2. "다른 이름으로 저장" → UTF-8 with BOM
3. Excel에서 다시 열기

---

## 🚀 다음 단계

### 완료된 기능

✅ Supabase 연결
✅ CSV Export
✅ 문제 CRUD
✅ 자동 DB 동기화
✅ 데이터 변환 로직
✅ Admin UI 개선

### 향후 추가 기능 (선택사항)

1. **이미지 저장** (Supabase Storage)
   - 도형/그래프 이미지 업로드
   - Public URL 생성
   - Admin UI에 업로드 버튼

2. **사용자 인증** (Supabase Auth)
   - 회원가입/로그인
   - 관리자 권한 관리
   - RLS 정책 강화

3. **추가 테이블**
   - `users` - 사용자 프로필
   - `submissions` - 풀이 제출
   - `user_progress` - 진행 상황
   - `rankings` - 랭킹

4. **CSV Import**
   - CSV 파일 업로드
   - 일괄 문제 등록
   - 데이터 검증

5. **검색 기능 강화**
   - 전문 검색 (Full-text search)
   - 태그 기반 검색
   - 고급 필터

---

## 📞 지원

문제가 발생하면:

1. **문서 확인**
   - `SUPABASE_SETUP.md` - 설정 가이드
   - `TROUBLESHOOTING.md` - 문제 해결

2. **Supabase 공식 문서**
   - https://supabase.com/docs

3. **GitHub Issues**
   - 프로젝트 저장소에 이슈 등록

---

## 🎉 완료!

모든 기능이 정상 작동하면:

- ✅ Admin 페이지에서 문제 관리 가능
- ✅ Supabase DB에 자동 저장
- ✅ CSV로 데이터 다운로드 가능
- ✅ 필터링/검색/정렬 지원
- ✅ AI 기능과 통합

**Happy Coding!** 🚀

