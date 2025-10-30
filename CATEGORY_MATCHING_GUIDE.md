# Category Matching Guide (UPDATED)

## ⚠️ Important Update

**This guide has been updated to reflect the actual Supabase categories structure:**
- Category IDs are **INTEGER** (1, 2, 3...), not TEXT ("1", "1-1", etc.)
- Total: **103 categories** (Level 1: 10, Level 2: 34, Level 3: 59)
- For complete category mappings, see `categories_mapping.md`

---

# Category Matching Guide

## AI 카테고리 자동 매칭 시스템

### 개요

AI가 이미지/PDF 문제를 분석할 때 자동으로 데이터베이스 카테고리에 매칭합니다.

### 매칭 프로세스

```
1. AI가 문제 분석
   ↓
2. 카테고리 예측 (Level 1-3)
   예: "Algebra > Elementary Algebra > Polynomials"
   ↓
3. 데이터베이스 카테고리와 매칭
   ↓
4. 성공 → 자동 선택
   실패 → 관리자에게 알림 + 제안
```

### 매칭 로직

#### Level 1 매칭 (필수)
- AI 예측: "Algebra"
- DB 검색: 정확한 일치 또는 부분 일치
- 성공: Level 1 선택 완료
- 실패: 경고 메시지 + 수동 선택 요청

#### Level 2 매칭 (선택)
- Level 1 성공 후 진행
- AI 예측: "Elementary Algebra"
- DB 검색: Level 1의 하위 카테고리에서 검색
- 성공: Level 2까지 선택 완료
- 부분 실패: Level 1만 선택 + 제안 메시지

#### Level 3 매칭 (선택)
- Level 2 성공 후 진행
- 현재는 제한적 지원 (주요 카테고리만)

### 매칭 실패 시 처리 방법

#### 1. AI 예측이 완전히 틀린 경우

**상황:**
```
AI 예측: "Physics > Mechanics"
데이터베이스: 수학 카테고리만 존재
```

**처리:**
- ⚠️ 경고 알림 표시
- 메시지: "데이터베이스에서 매칭 실패. 수동으로 선택해주세요."
- 제안: 가장 가능성 높은 카테고리 추천 (예: Algebra)
- 관리자가 드롭다운에서 직접 선택

#### 2. Level 1은 맞지만 Level 2가 틀린 경우

**상황:**
```
AI 예측: "Algebra > Advanced Topics"
데이터베이스: "Algebra"는 있지만 "Advanced Topics"는 없음
```

**처리:**
- ✅ Level 1 자동 선택 (Algebra)
- ℹ️ 정보 메시지: "Algebra 선택됨. 'Advanced Topics'를 찾을 수 없어 하위 카테고리는 수동 선택이 필요합니다."
- 관리자가 Level 2 드롭다운에서 선택

#### 3. 비슷하지만 정확하지 않은 경우

**상황:**
```
AI 예측: "Calculus"
데이터베이스: "Analysis > Calculus"
```

**처리:**
- 부분 매칭 로직 작동
- "Calculus"를 포함하는 카테고리 검색
- 찾으면 자동 선택
- 못 찾으면 유사한 항목 제안

### 매칭 개선 전략

#### 현재 구현:
```typescript
// 정확한 일치
cat.name.toLowerCase() === aiLevel1.toLowerCase()

// 또는 부분 일치
aiLevel1.toLowerCase().includes(cat.name.toLowerCase())
cat.name.toLowerCase().includes(aiLevel1.toLowerCase())
```

#### 향후 개선안:
1. **Fuzzy Matching**: 오타 허용 (예: "Algebr" → "Algebra")
2. **동의어 매핑**: "Number Theory" = "숫자론" = "정수론"
3. **AI 재학습**: 데이터베이스 카테고리를 AI 프롬프트에 포함
4. **사용자 피드백**: 매칭 실패 시 올바른 선택을 학습

### 관리자 워크플로우

#### ✅ 성공 케이스:
```
1. 이미지 업로드
2. "Analyze with AI" 클릭
3. 자동으로 모든 필드 채워짐:
   - Title: "Quadratic Equation Problem"
   - Category: "Algebra > Elementary Algebra" ✓
   - Difficulty: 5/10
4. 확인 후 저장
```

#### ⚠️ 실패 케이스:
```
1. 이미지 업로드
2. "Analyze with AI" 클릭
3. 알림 표시:
   "⚠️ Category Matching Issue
   AI suggested: XYZ
   Couldn't find exact match
   Suggestion: Select 'Algebra'"
4. 관리자가 드롭다운에서 수동 선택
5. 나머지 필드는 자동 채워짐
6. 저장
```

### 카테고리 추가 시 고려사항

새로운 카테고리를 Supabase DB에 추가할 때:

1. **프론트엔드 업데이트**
   - `CATEGORIES` 객체에 추가
   - 계층 구조 유지

2. **AI 프롬프트 업데이트**
   - API 라우트의 카테고리 리스트에 추가
   - 예시와 함께 제공

3. **테스트**
   - AI가 새 카테고리를 정확히 예측하는지 확인
   - 매칭 로직이 작동하는지 검증

### 모니터링 & 개선

#### 수집할 데이터:
- 매칭 성공률
- 가장 자주 실패하는 카테고리
- 관리자가 수동으로 수정하는 빈도

#### 개선 방향:
1. 실패율 높은 카테고리 → AI 프롬프트 강화
2. 새로운 패턴 발견 → 매칭 로직 업데이트
3. 사용자 피드백 → DB 카테고리 재구성

## FAQ

### Q: AI가 항상 카테고리를 예측하나요?
**A:** 네, 하지만 confidence score가 낮으면 경고를 표시합니다.

### Q: 수동으로 선택한 카테고리가 저장되나요?
**A:** 네, 관리자가 최종 선택한 카테고리로 저장됩니다.

### Q: 매칭이 실패해도 문제를 저장할 수 있나요?
**A:** 네, 카테고리만 수동으로 선택하면 나머지는 정상 저장됩니다.

### Q: 영어가 아닌 다른 언어도 지원하나요?
**A:** GPT-4는 다국어를 지원하지만, 현재 DB 카테고리는 영어로만 되어 있습니다.

## 예시

### 성공 예시:
```json
AI Response:
{
  "categoryLevel1": "Algebra",
  "categoryLevel2": "Elementary Algebra",
  "categoryLevel3": "Polynomials",
  "categoryConfidence": 0.95
}

Result: ✅ Matched successfully
Display: "Algebra > Elementary Algebra > Polynomials"
```

### 부분 성공 예시:
```json
AI Response:
{
  "categoryLevel1": "Geometry",
  "categoryLevel2": "Space Geometry",  // Not in DB
  "categoryConfidence": 0.8
}

Result: ⚠️ Partial match
Display: "Geometry" (Level 1 only)
Message: "Could not match 'Space Geometry'. Please select from available options."
```

### 실패 예시:
```json
AI Response:
{
  "categoryLevel1": "Physics",  // Not a math category
  "categoryLevel2": "Mechanics",
  "categoryConfidence": 0.7
}

Result: ❌ No match
Display: Empty
Message: "Category 'Physics' not found in database. Please select manually."
```

