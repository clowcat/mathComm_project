# Learning Path Design - 학습 경로 설계

## 🎯 목표

사용자가 난이도가 낮은 문제부터 시작해서 단계별로 학습하며 최종 목표 문제를 풀 수 있도록 돕는 시스템

---

## 📊 데이터 구조 개선

### Before (현재 - 문제 있음)
```
problems 테이블만 사용:
- linked_problem_ids: [uuid1, uuid2, uuid3]
  
문제점:
❌ 순서 정보 없음
❌ 관계 타입 불명확
❌ 계층 구조 표현 어려움
❌ 메타데이터 부족
```

### After (개선안 - problem_relationships 활용)
```
problem_relationships 테이블 활용:
- source_problem_id: 출발 문제
- target_problem_id: 도착 문제
- relationship_type: 관계 타입
  - 'prerequisite': 선행 문제 (먼저 풀어야 함)
  - 'derived': 파생 문제 (같은 개념)
  - 'next': 다음 단계 문제 (순차적 학습)
  - 'alternative': 대체 문제 (비슷한 난이도)
- sequence_order: 순서 (0, 1, 2, ...)
- concept: 개념 정보
- strength: 관계 강도 (0.0-1.0)
```

---

## 🌳 학습 경로 예시

### 케이스 1: 난이도 기반 선형 경로
```
[Easy] Problem A (난이도 2)
  ↓ [next, order=0]
[Medium] Problem B (난이도 5)
  ↓ [next, order=1]
[Hard] Problem C (난이도 8) ← 최종 목표
```

### 케이스 2: 다중 선행 문제
```
[선행] Problem D (개념: 인수분해)
  ↘
   [prerequisite]
    ↘
     [목표] Problem X (개념: 이차방정식)
    ↗
   [prerequisite]
  ↗
[선행] Problem E (개념: 완전제곱)
```

### 케이스 3: 계층적 파생 (깊이 있는 학습)
```
[원본] Problem 1 (난이도 8)
  ├─[derived] Problem 1-1 (난이도 3)
  │   ├─[derived] Problem 1-1-1 (난이도 1) ← 가장 기초
  │   └─[derived] Problem 1-1-2 (난이도 2)
  ├─[derived] Problem 1-2 (난이도 5)
  └─[derived] Problem 1-3 (난이도 7)

학습 순서:
1. 1-1-1 (난이도 1) → 시작
2. 1-1-2 (난이도 2)
3. 1-1 (난이도 3)
4. 1-2 (난이도 5)
5. 1-3 (난이도 7)
6. Problem 1 (난이도 8) → 최종 목표
```

---

## 🔧 구현 계획

### Phase 1: 데이터 저장 개선 ✅ (이미 부분적으로 구현됨)
```typescript
// 파생 문제 저장 시
problemRelationshipsAPI.create(
  parentId,
  derivedId,
  'derived',
  { concept, sequenceOrder, strength }
);

// 다음 단계 문제 연결 시
problemRelationshipsAPI.create(
  currentId,
  nextId,
  'next',
  { sequenceOrder: 0 }
);
```

### Phase 2: 학습 경로 조회 API (신규)
```typescript
// 특정 문제의 전체 학습 경로 조회
const learningPath = await getLearningPath(problemId);
// 반환: [
//   { problem, difficulty: 1, step: 1, concept: "..." },
//   { problem, difficulty: 3, step: 2, concept: "..." },
//   { problem, difficulty: 5, step: 3, concept: "..." },
//   ...
// ]

// 난이도 순으로 정렬된 선행 문제들
const prerequisites = await getPrerequisites(problemId);

// 다음 추천 문제
const nextProblems = await getNextProblems(currentProblemId);
```

### Phase 3: Admin UI 개선 (이번 작업)
```
✅ Problem List에 관계 시각화
✅ 트리 구조로 표시
✅ 순서 정보 표시
✅ 관계 편집 기능
```

### Phase 4: 사용자 페이지 (향후)
```
- 학습 경로 시각화
- 진행 상황 트래킹
- 추천 다음 문제
```

---

## 🎨 Admin UI 개선안

### 현재 UI
```
📋 Problem List
  □ Problem A (3 linked problems) ← 뭔지 모름
  □ Problem B 
  □ Problem C
```

### 개선안 1: 펼치기/접기
```
📋 Problem List
  ▼ Problem A (3 linked problems)
    ├─ 1️⃣ [Next] Problem A-1 (난이도 2) → Problem A-2
    ├─ 2️⃣ [Next] Problem A-2 (난이도 5) → Problem A
    └─ 3️⃣ [Derived] Problem A-variant (난이도 8)
  □ Problem B
  □ Problem C
```

### 개선안 2: 트리 뷰
```
📋 Problem List (Tree View)
  📘 [Original] Solve Quadratic Equations (난이도 8)
    │
    ├─ 🔵 [Step 1] Factoring Basics (난이도 2)
    │   └─ 🟢 [Step 1.1] Simple Factoring (난이도 1)
    │
    ├─ 🔵 [Step 2] Quadratic Formula (난이도 5)
    │
    └─ 🔵 [Step 3] Completing the Square (난이도 7)
```

### 개선안 3: 관계 편집 모드
```
[Edit Relationships]
Source: Problem A
  Add Relationship:
    Type: [Next ▼]
    Target: [Select Problem ▼]
    Order: [0]
    Concept: [Quadratic Equations]
  
  Existing Relationships:
    ✏️ Next → Problem B (Order: 0, Concept: Factoring)
    ✏️ Derived → Problem C (Order: 1, Concept: Similar)
    🗑️ Delete
```

---

## 📐 데이터베이스 쿼리 예시

### 1. 학습 경로 생성 (난이도 순)
```sql
-- 특정 문제로 가는 모든 경로 (재귀)
WITH RECURSIVE learning_path AS (
  -- Base: 목표 문제
  SELECT 
    p.id,
    p.title,
    p.difficulty,
    0 as depth,
    ARRAY[p.id] as path
  FROM problems p
  WHERE p.id = 'target-problem-id'
  
  UNION ALL
  
  -- Recursive: 선행 문제들
  SELECT 
    p.id,
    p.title,
    p.difficulty,
    lp.depth + 1,
    lp.path || p.id
  FROM problems p
  JOIN problem_relationships pr ON pr.target_problem_id = lp.id
  JOIN learning_path lp ON pr.source_problem_id = p.id
  WHERE pr.relationship_type IN ('prerequisite', 'next')
    AND NOT (p.id = ANY(lp.path))  -- 순환 방지
)
SELECT * FROM learning_path
ORDER BY difficulty ASC;  -- 쉬운 것부터
```

### 2. 파생 문제 계층 구조
```sql
-- 파생 문제 트리
WITH RECURSIVE problem_tree AS (
  SELECT 
    p.id,
    p.title,
    p.difficulty,
    p.parent_problem_id,
    0 as level,
    p.title as path
  FROM problems p
  WHERE p.parent_problem_id IS NULL  -- 루트
  
  UNION ALL
  
  SELECT 
    p.id,
    p.title,
    p.difficulty,
    p.parent_problem_id,
    pt.level + 1,
    pt.path || ' > ' || p.title
  FROM problems p
  JOIN problem_tree pt ON p.parent_problem_id = pt.id
)
SELECT 
  REPEAT('  ', level) || title as indented_title,
  difficulty,
  level
FROM problem_tree
ORDER BY path;
```

---

## 🚀 다음 단계

1. ✅ Admin UI에 관계 시각화 추가
2. ✅ 트리 구조로 linked 문제 표시
3. ⏳ 관계 편집 기능 추가
4. ⏳ 학습 경로 자동 생성 기능
5. ⏳ 사용자 페이지에 학습 경로 표시

---

## 💡 추가 아이디어

### 자동 학습 경로 생성
```typescript
// AI가 문제를 분석해서 자동으로 학습 경로 생성
const path = await generateLearningPath(targetProblem);
// 1. 난이도 분석
// 2. 필요한 개념 파악
// 3. 기존 문제 중 적합한 것 찾기
// 4. 없으면 AI로 새 문제 생성
// 5. 관계 자동 설정
```

### 사용자 맞춤 경로
```typescript
// 사용자 실력에 맞는 시작점 추천
const startPoint = await recommendStartingPoint(
  targetProblem,
  userLevel,
  solvedProblems
);
```

---

## 📝 참고

- `PROBLEM_RELATIONSHIPS_GUIDE.md` - 관계 테이블 상세 가이드
- `DATABASE_SCHEMA.md` - 전체 DB 스키마

