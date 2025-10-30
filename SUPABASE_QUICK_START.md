# 🚀 Supabase 빠른 시작 가이드

이 가이드를 따라하면 5분 안에 Supabase를 연동할 수 있습니다!

---

## 📍 1단계: Supabase 연동 정보 확인

### Supabase Dashboard 접속
1. [https://supabase.com](https://supabase.com)에 로그인
2. 프로젝트 선택 (없으면 새로 생성)

### API 키 복사
**경로**: 좌측 메뉴 → ⚙️ **Settings** → **API** 탭

다음 두 값을 복사하세요:

```
📌 Project URL
https://xxxxxxxxxxxxx.supabase.co

📌 anon public (API Key)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```

---

## 🔧 2단계: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 열고 **아래 내용을 추가**하세요:

```bash
# OpenAI API (이미 있음)
OPENAI_API_KEY=sk-proj-...

# Supabase (새로 추가)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **중요**: 
- `xxxxxxxxxxxxx.supabase.co` 부분을 실제 Project URL로 교체
- `eyJhbGci...` 부분을 실제 anon public key로 교체
- **개발 서버를 재시작**해야 적용됩니다: `npm run dev` 중지 후 다시 실행

---

## 🗄️ 3단계: 데이터베이스 테이블 생성

### categories 테이블 확인
현재 Supabase에 `categories` 테이블이 이미 있으므로 **건너뜁니다**.

### 다른 테이블 생성

**경로**: Supabase Dashboard → 좌측 메뉴 🔧 **SQL Editor** → **New query**

아래 두 가지 방법 중 하나를 선택하세요:

#### 방법 1: 파일 업로드 (추천 ⭐)
1. 프로젝트에서 `supabase_tables_create.sql` 파일 내용을 복사
2. SQL Editor에 붙여넣기
3. **Run** 버튼 클릭

#### 방법 2: 수동 실행
`DATABASE_SCHEMA.md`의 SQL을 **순서대로** 복사하여 실행:
1. `problems` 테이블
2. `users` 테이블
3. `submissions` 테이블
4. `user_progress` 테이블
5. `skill_tree` 테이블
6. `rankings` 테이블
7. `discussions` 테이블
8. `problem_relationships` 테이블 ⭐
9. `ai_generated_problems_temp` 테이블

---

## 🔐 4단계: RLS (보안 정책) 설정

**SQL Editor**에서 `supabase_rls_policies.sql` 파일 내용을 실행하세요.

```sql
-- problems 테이블 - 모두 읽기, 인증된 사용자만 수정
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view problems" ...
-- (전체 내용은 supabase_rls_policies.sql 참고)
```

---

## ✅ 5단계: 연동 테스트

### 개발 서버 재시작
```bash
# 터미널에서 Ctrl+C로 중지 후
npm run dev
```

### Admin 페이지 접속
```
http://localhost:3000/admin/problems
```

### 확인 사항
1. 페이지 상단에 **"✅ Loaded X problems from database"** 메시지가 보이면 성공!
2. **"Sync from DB"** 버튼 클릭 시 문제 목록이 로드되면 성공!
3. 새 문제를 입력하고 **"Save Problem"** 클릭 시 저장되면 성공!

---

## 🛠️ 문제 해결

### ❌ "Database not connected" 에러
**원인**: 환경 변수가 설정되지 않았거나 잘못됨

**해결**:
1. `.env.local` 파일 확인
2. `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 정확한지 확인
3. 개발 서버 재시작 (`npm run dev`)

### ❌ "relation does not exist" 에러
**원인**: 테이블이 생성되지 않음

**해결**:
1. Supabase Dashboard → **Table Editor** 확인
2. `problems` 테이블이 없으면 `supabase_tables_create.sql` 실행
3. SQL 실행 시 에러 메시지 확인

### ❌ "permission denied" 에러
**원인**: RLS 정책이 설정되지 않음

**해결**:
1. `supabase_rls_policies.sql` 실행
2. 또는 임시로 RLS를 비활성화:
```sql
ALTER TABLE problems DISABLE ROW LEVEL SECURITY;
```

### ❌ Categories 관련 에러
**원인**: `categories` 테이블이 없거나 구조가 다름

**해결**:
1. Supabase → **Table Editor** → `categories` 확인
2. `categories_rows.csv`의 구조와 일치하는지 확인:
   - `category_id` (INTEGER)
   - `name` (TEXT)
   - `level` (INTEGER)
   - `parent_id` (INTEGER, nullable)

---

## 📚 추가 리소스

- **`DATABASE_SCHEMA.md`** - 전체 DB 스키마
- **`categories_mapping.md`** - 카테고리 전체 목록
- **`SUPABASE_SETUP.md`** - 상세 설정 가이드
- **`supabase_tables_create.sql`** - 테이블 생성 SQL
- **`supabase_rls_policies.sql`** - RLS 정책 SQL

---

## 🎯 다음 단계

✅ Supabase 연동 완료!

이제 다음을 할 수 있습니다:
- ✅ Admin 페이지에서 문제 생성/수정/삭제
- ✅ AI로 문제 분석 및 파생 문제 생성
- ✅ 데이터베이스에 자동 저장
- ✅ CSV로 문제 export

**Happy Coding! 🚀**

