# Problem Relationships 사용 가이드

## 📋 개요

`problem_relationships` 테이블은 **원 문제와 파생 문제**, **선행 문제**, **관련 문제** 등의 관계를 저장하여 체계적인 학습 경로를 구성합니다.

## 🔗 관계 타입 (relationship_type)

### 1. **derived** (파생 문제)
**의미**: AI가 원 문제로부터 생성한 문제

**사용 시나리오**:
```
원 문제: "이차방정식 x² + 5x + 6 = 0을 풀어라"
    │
    ├─[derived]─→ 파생 문제 1: "x² + 3x + 2 = 0을 풀어라" (더 쉬운 계수)
    ├─[derived]─→ 파생 문제 2: "x² + 7x + 12 = 0을 풀어라" (비슷한 난이도)
    └─[derived]─→ 파생 문제 3: "x² - 5x + 6 = 0을 풀어라" (음수 계수)
```

**SQL 예시**:
```sql
INSERT INTO problem_relationships (
  source_problem_id,
  target_problem_id,
  relationship_type,
  concept,
  is_ai_generated,
  ai_confidence
) VALUES (
  'original-problem-uuid',
  'derived-problem-uuid',
  'derived',
  'Quadratic Equations - Factoring',
  true,
  0.95
);
```

### 2. **prerequisite** (선행 문제)
**의미**: target 문제를 풀기 전에 source 문제를 먼저 풀어야 함

**사용 시나리오**:
```
문제 A: "이차방정식의 근의 공식 증명" (난이도 7)
    │
    └─[prerequisite]─→ 문제 B: "완전제곱식 만들기" (난이도 4)
    
→ 사용자가 문제 A를 보려면 먼저 문제 B를 완료해야 함
```

**SQL 예시**:
```sql
INSERT INTO problem_relationships (
  source_problem_id,
  target_problem_id,
  relationship_type,
  sequence_order,
  description
) VALUES (
  'basic-problem-uuid',
  'advanced-problem-uuid',
  'prerequisite',
  1,
  'Must understand completing the square before proving quadratic formula'
);
```

### 3. **related** (관련 문제)
**의미**: 같은 수학 개념을 다루는 관련 문제

**사용 시나리오**:
```
문제 A: "피타고라스 정리를 이용한 거리 계산"
    │
    ├─[related]─→ 문제 B: "피타고라스 정리 증명"
    └─[related]─→ 문제 C: "3D 공간에서의 거리"
```

### 4. **next** (다음 문제)
**의미**: 학습 경로에서 다음으로 추천되는 문제

**사용 시나리오**:
```
학습 경로:
문제 1 (난이도 3) ─[next]→ 문제 2 (난이도 5) ─[next]→ 문제 3 (난이도 7)
```

### 5. **alternative** (대체 문제)
**의미**: 비슷한 난이도의 대체 문제

**사용 시나리오**:
```
문제 A: "삼각함수의 덧셈정리" (난이도 6)
    │
    ├─[alternative]─→ 문제 B: "삼각함수의 배각공식" (난이도 6)
    └─[alternative]─→ 문제 C: "삼각함수의 반각공식" (난이도 6)
    
→ 사용자가 문제 A를 너무 어려워하면 문제 B나 C를 추천
```

## 💾 데이터 저장 예시

### 예시 1: AI가 파생 문제 생성

```sql
-- 원 문제와 3개의 파생 문제 관계 저장
INSERT INTO problem_relationships 
  (source_problem_id, target_problem_id, relationship_type, sequence_order, concept, strength, is_ai_generated, ai_confidence)
VALUES
  ('uuid-original', 'uuid-derived-1', 'derived', 1, 'Linear Equations - Basic', 0.85, true, 0.92),
  ('uuid-original', 'uuid-derived-2', 'derived', 2, 'Linear Equations - Intermediate', 0.75, true, 0.88),
  ('uuid-original', 'uuid-derived-3', 'derived', 3, 'Linear Equations - Advanced', 0.65, true, 0.85);
```

### 예시 2: 학습 경로 구성

```sql
-- 선형 방정식 학습 경로
INSERT INTO problem_relationships 
  (source_problem_id, target_problem_id, relationship_type, sequence_order, priority)
VALUES
  ('uuid-prob-1', 'uuid-prob-2', 'next', 1, 10),  -- 문제 1 → 문제 2
  ('uuid-prob-2', 'uuid-prob-3', 'next', 2, 10),  -- 문제 2 → 문제 3
  ('uuid-prob-3', 'uuid-prob-4', 'next', 3, 10);  -- 문제 3 → 문제 4

-- 문제 4를 풀기 전에 문제 2를 먼저 풀어야 함
INSERT INTO problem_relationships 
  (source_problem_id, target_problem_id, relationship_type)
VALUES
  ('uuid-prob-2', 'uuid-prob-4', 'prerequisite');
```

## 🔍 조회 쿼리 예시

### 1. 특정 문제의 모든 파생 문제 조회

```sql
SELECT 
  pr.target_problem_id,
  p.title,
  p.difficulty,
  pr.concept,
  pr.ai_confidence
FROM problem_relationships pr
JOIN problems p ON pr.target_problem_id = p.id
WHERE pr.source_problem_id = 'original-problem-uuid'
  AND pr.relationship_type = 'derived'
ORDER BY pr.sequence_order;
```

### 2. 특정 문제의 선행 요건 조회

```sql
SELECT 
  pr.source_problem_id,
  p.title,
  p.difficulty,
  pr.description
FROM problem_relationships pr
JOIN problems p ON pr.source_problem_id = p.id
WHERE pr.target_problem_id = 'target-problem-uuid'
  AND pr.relationship_type = 'prerequisite'
ORDER BY pr.sequence_order;
```

### 3. 학습 경로 전체 조회

```sql
SELECT 
  p_source.title as from_problem,
  p_target.title as to_problem,
  pr.relationship_type,
  pr.sequence_order,
  pr.concept
FROM problem_relationships pr
JOIN problems p_source ON pr.source_problem_id = p_source.id
JOIN problems p_target ON pr.target_problem_id = p_target.id
WHERE pr.relationship_type IN ('next', 'prerequisite')
  AND pr.is_approved = true
ORDER BY pr.sequence_order;
```

### 4. AI 생성 관계 중 승인 대기 중인 항목 조회

```sql
SELECT 
  p_source.title as original,
  p_target.title as generated,
  pr.concept,
  pr.ai_confidence,
  pr.created_at
FROM problem_relationships pr
JOIN problems p_source ON pr.source_problem_id = p_source.id
JOIN problems p_target ON pr.target_problem_id = p_target.id
WHERE pr.is_ai_generated = true
  AND pr.is_approved = false
ORDER BY pr.created_at DESC;
```

## 🎯 Admin 페이지에서의 활용

### Admin UI에서 관계 저장

```typescript
// Admin 페이지에서 "Generate Related Problems" 클릭 시
const saveRelationships = async (originalProblemId: string, relatedProblems: any[]) => {
  for (const [index, relProblem] of relatedProblems.entries()) {
    // 1. 파생 문제 저장
    const savedProblem = await problemsAPI.create({
      title: relProblem.title,
      content: relProblem.content,
      // ... 기타 필드
      is_generated: true,
      parent_problem_id: originalProblemId,
    });
    
    // 2. 관계 저장
    await supabase
      .from('problem_relationships')
      .insert({
        source_problem_id: originalProblemId,
        target_problem_id: savedProblem.id,
        relationship_type: 'derived',
        sequence_order: index + 1,
        concept: relProblem.concept,
        strength: 0.8,
        is_ai_generated: true,
        ai_confidence: 0.9,
      });
  }
};
```

### 사용자 페이지에서 관계 조회

```typescript
// 문제 페이지에서 "Related Problems" 표시
const getRelatedProblems = async (problemId: string) => {
  const { data } = await supabase
    .from('problem_relationships')
    .select(`
      target_problem_id,
      relationship_type,
      concept,
      problems:target_problem_id (
        id,
        title,
        difficulty,
        xp
      )
    `)
    .eq('source_problem_id', problemId)
    .in('relationship_type', ['derived', 'related', 'alternative'])
    .eq('is_approved', true)
    .order('sequence_order');
  
  return data;
};
```

## 📊 통계 및 분석

### 학습 성공률 계산

```sql
-- 특정 관계를 따라 학습한 사용자의 성공률 계산
WITH relationship_stats AS (
  SELECT 
    pr.id as relationship_id,
    COUNT(DISTINCT up_source.user_id) as users_completed_source,
    COUNT(DISTINCT CASE 
      WHEN up_target.status = 'completed' 
      THEN up_target.user_id 
    END) as users_completed_target
  FROM problem_relationships pr
  JOIN user_progress up_source ON pr.source_problem_id = up_source.problem_id
    AND up_source.status = 'completed'
  LEFT JOIN user_progress up_target ON pr.target_problem_id = up_target.problem_id
    AND up_target.user_id = up_source.user_id
  WHERE pr.relationship_type IN ('next', 'prerequisite')
  GROUP BY pr.id
)
UPDATE problem_relationships pr
SET success_rate = (
  SELECT (users_completed_target::NUMERIC / users_completed_source * 100)
  FROM relationship_stats rs
  WHERE rs.relationship_id = pr.id
);
```

## 🎨 시각화 예시

### 학습 경로 그래프

```
[문제 A]
    ├─[prerequisite]─→ [문제 B]
    │                      │
    │                      └─[next]─→ [문제 D]
    │
    └─[derived]─→ [문제 C]
                     │
                     └─[alternative]─→ [문제 E]
```

## ⚠️ 주의사항

### 1. 순환 참조 방지

```sql
-- 순환 참조 체크 트리거 (선택사항)
CREATE OR REPLACE FUNCTION check_circular_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source_problem_id = NEW.target_problem_id THEN
    RAISE EXCEPTION 'Cannot create self-referencing relationship';
  END IF;
  
  -- 추가: 복잡한 순환 참조 체크 로직
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_circular_relationships
BEFORE INSERT OR UPDATE ON problem_relationships
FOR EACH ROW EXECUTE FUNCTION check_circular_reference();
```

### 2. 관계 강도 (strength) 값

- **0.00 - 0.30**: 약한 관계 (참고용)
- **0.30 - 0.70**: 보통 관계 (추천 가능)
- **0.70 - 1.00**: 강한 관계 (강력 추천)

### 3. AI 생성 관계 승인 워크플로우

```
1. AI가 관계 생성 (is_approved = false)
2. 관리자 검토
3. 승인 (is_approved = true, approved_by = admin_id)
   또는 거부 (DELETE)
```

## 📚 참고

- **DATABASE_SCHEMA.md** - 전체 스키마
- **IMPLEMENTATION_SUMMARY.md** - 구현 요약
- **PRD.md** - 프로젝트 요구사항

