# Supabase 에러 해결 가이드

## 🚨 "Failed to save to Supabase" 에러

이 에러가 발생하면 다음 순서로 확인하세요:

---

## 1️⃣ 환경 변수 확인

### 확인 방법
브라우저 콘솔에서 다음을 확인하세요:

```
⚠️ Supabase not configured. Problem saved locally only.
```

이 메시지가 보이면 환경 변수가 설정되지 않은 것입니다.

### 해결 방법

**1단계**: `.env.local` 파일이 있는지 확인
```bash
ls -la .env.local
```

**2단계**: 파일을 열어서 내용 확인
```bash
cat .env.local
```

다음과 같이 되어 있어야 합니다:
```bash
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**3단계**: 값이 없거나 잘못되었다면 수정
- Supabase Dashboard → Settings → API에서 복사

**4단계**: 개발 서버 재시작 ⚠️ 필수!
```bash
# Ctrl+C로 중지 후
npm run dev
```

---

## 2️⃣ Supabase 테이블 확인

### 확인 방법
Supabase Dashboard → Table Editor에서 `problems` 테이블이 있는지 확인

### 해결 방법

**테이블이 없다면**:
1. Supabase Dashboard → SQL Editor
2. `supabase_tables_create.sql` 파일 내용 복사
3. 실행

자세한 내용: `SUPABASE_QUICK_START.md` 참고

---

## 3️⃣ RLS (Row Level Security) 정책 확인

### 확인 방법
브라우저 콘솔에 다음과 같은 메시지가 있는지 확인:
```
Failed to create problem: new row violates row-level security policy
```

### 해결 방법

**옵션 1: RLS 정책 설정** (권장)
```sql
-- Supabase SQL Editor에서 실행
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert problems"
  ON problems FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update problems"
  ON problems FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

**옵션 2: RLS 임시 비활성화** (개발 중에만)
```sql
-- ⚠️ 주의: 보안 위험!
ALTER TABLE problems DISABLE ROW LEVEL SECURITY;
```

전체 정책: `supabase_rls_policies.sql` 참고

---

## 4️⃣ 네트워크 연결 확인

### 확인 방법
브라우저 콘솔 → Network 탭에서 Supabase 요청 확인

### 해결 방법
- 인터넷 연결 확인
- 방화벽 설정 확인
- VPN이 차단하는지 확인

---

## 5️⃣ 데이터 타입 불일치

### 확인 방법
브라우저 콘솔에 다음과 같은 메시지:
```
Failed to create problem: column "category_level1" is of type integer but expression is of type text
```

### 해결 방법
이미 최신 코드에 반영되어 있습니다:
- `category_level1/2/3`는 **INTEGER** 타입으로 저장됨
- `src/lib/categories.ts`에서 올바른 ID 사용

---

## 🔍 디버깅 팁

### 1. 브라우저 콘솔 확인
F12 → Console 탭에서 상세 에러 로그 확인:
```
Failed to save to Supabase: {...}
Error details: { message: "...", ... }
```

### 2. Supabase 로그 확인
Supabase Dashboard → Logs → API Logs에서 요청 실패 이유 확인

### 3. 테스트 쿼리 실행
SQL Editor에서 직접 INSERT 테스트:
```sql
INSERT INTO problems (title, content, difficulty, category_level1)
VALUES ('Test Problem', 'Test content', 5, 1)
RETURNING *;
```

---

## ✅ 체크리스트

문제 저장이 안될 때 다음을 순서대로 확인:

- [ ] `.env.local` 파일이 있고 값이 올바름
- [ ] 개발 서버를 재시작함 (`npm run dev`)
- [ ] Supabase `problems` 테이블이 존재함
- [ ] RLS 정책이 설정되어 있거나 비활성화됨
- [ ] 인터넷 연결이 정상임
- [ ] 브라우저 콘솔에 구체적인 에러 메시지 확인
- [ ] Supabase Dashboard에서 테이블 구조 확인

---

## 💡 여전히 안된다면

1. **로컬 모드로 우회**:
   - Supabase 없이 브라우저 메모리에만 저장
   - "Export CSV" 버튼으로 백업 가능

2. **Issue 제보**:
   - 브라우저 콘솔의 전체 에러 로그
   - Supabase 테이블 구조 스크린샷
   - `.env.local` 내용 (키는 가리고)

3. **문서 참고**:
   - `SUPABASE_QUICK_START.md` - 빠른 시작
   - `SUPABASE_SETUP.md` - 상세 설정
   - `DATABASE_SCHEMA.md` - DB 구조

