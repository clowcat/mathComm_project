-- ========================================
-- MathComm Row Level Security (RLS) Policies
-- 테이블 생성 후 실행하세요
-- ========================================

-- ========================================
-- 1. problems 테이블 - 모두 읽기, 관리자만 수정
-- ========================================
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 문제를 볼 수 있음
CREATE POLICY "Anyone can view problems"
  ON problems FOR SELECT
  TO public
  USING (true);

-- 인증된 사용자만 문제를 생성/수정/삭제할 수 있음 (Admin 페이지용)
-- 나중에 관리자 권한 체크를 추가할 수 있습니다
CREATE POLICY "Authenticated users can insert problems"
  ON problems FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update problems"
  ON problems FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete problems"
  ON problems FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- 2. users 테이블 - 본인 데이터만 수정
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터를 볼 수 있음
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 사용자는 자신의 데이터를 수정할 수 있음
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 새 사용자 생성 (회원가입)
CREATE POLICY "Users can insert their own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ========================================
-- 3. submissions 테이블 - 본인 제출만 관리
-- ========================================
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 제출을 볼 수 있음
CREATE POLICY "Users can view their own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 사용자는 자신의 제출을 생성할 수 있음
CREATE POLICY "Users can insert their own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 4. user_progress 테이블 - 본인 진행 상황만
-- ========================================
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 진행 상황을 볼 수 있음
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 사용자는 자신의 진행 상황을 생성/수정할 수 있음
CREATE POLICY "Users can manage their own progress"
  ON user_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 5. skill_tree 테이블 - 모두 읽기, 관리자만 수정
-- ========================================
ALTER TABLE skill_tree ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 스킬 트리를 볼 수 있음
CREATE POLICY "Anyone can view skill tree"
  ON skill_tree FOR SELECT
  TO public
  USING (true);

-- 인증된 사용자만 수정 (관리자용)
CREATE POLICY "Authenticated users can manage skill tree"
  ON skill_tree FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 6. rankings 테이블 - 모두 읽기
-- ========================================
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 랭킹을 볼 수 있음
CREATE POLICY "Anyone can view rankings"
  ON rankings FOR SELECT
  TO public
  USING (true);

-- 시스템만 랭킹 업데이트 (service_role key 사용)
-- 일반 사용자는 랭킹을 직접 수정할 수 없음

-- ========================================
-- 7. discussions 테이블 - 댓글 관리
-- ========================================
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 댓글을 볼 수 있음
CREATE POLICY "Anyone can view discussions"
  ON discussions FOR SELECT
  TO public
  USING (true);

-- 인증된 사용자는 댓글을 작성할 수 있음
CREATE POLICY "Authenticated users can create discussions"
  ON discussions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 댓글을 수정/삭제할 수 있음
CREATE POLICY "Users can update their own discussions"
  ON discussions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discussions"
  ON discussions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ========================================
-- 8. problem_relationships 테이블 - 모두 읽기, 관리자만 수정
-- ========================================
ALTER TABLE problem_relationships ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 문제 관계를 볼 수 있음
CREATE POLICY "Anyone can view problem relationships"
  ON problem_relationships FOR SELECT
  TO public
  USING (true);

-- 인증된 사용자만 관계 생성/수정 (Admin 및 AI)
CREATE POLICY "Authenticated users can manage relationships"
  ON problem_relationships FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 9. ai_generated_problems_temp 테이블 - 관리자만
-- ========================================
ALTER TABLE ai_generated_problems_temp ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 AI 생성 문제를 볼 수 있음 (관리자)
CREATE POLICY "Authenticated users can view temp problems"
  ON ai_generated_problems_temp FOR SELECT
  TO authenticated
  USING (true);

-- 인증된 사용자만 AI 생성 문제를 관리할 수 있음
CREATE POLICY "Authenticated users can manage temp problems"
  ON ai_generated_problems_temp FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- ✅ RLS 정책 설정 완료!
-- ========================================
-- 
-- 참고:
-- 1. 현재는 authenticated 사용자가 모든 작업을 할 수 있습니다
-- 2. 나중에 users.tier를 체크하여 관리자 권한을 제한할 수 있습니다
-- 3. service_role key를 사용하면 모든 RLS를 우회할 수 있습니다 (서버 사이드용)

