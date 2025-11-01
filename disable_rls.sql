-- ========================================
-- RLS 비활성화 (개발 중에만 사용)
-- Supabase SQL Editor에서 실행하세요
-- ========================================

-- problems 테이블의 RLS 비활성화
ALTER TABLE problems DISABLE ROW LEVEL SECURITY;

-- problem_relationships 테이블의 RLS 비활성화 (있는 경우)
ALTER TABLE problem_relationships DISABLE ROW LEVEL SECURITY;

-- ✅ 완료!
-- 이제 Admin 페이지에서 문제를 저장할 수 있습니다.

-- ========================================
-- 나중에 RLS를 다시 활성화하려면:
-- ========================================
-- ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE problem_relationships ENABLE ROW LEVEL SECURITY;

-- 그리고 supabase_rls_policies.sql 파일을 실행하세요.

