# Categories 구조 업데이트 요약

## 🔄 변경 사항

실제 Supabase에 있는 `categories` 테이블 구조에 맞춰 모든 문서와 코드를 업데이트했습니다.

---

## 📊 실제 DB 구조

### 테이블 정의
```sql
CREATE TABLE categories (
  category_id INTEGER PRIMARY KEY,  -- 숫자 ID (1~103)
  name TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
  parent_id INTEGER REFERENCES categories(category_id)
);
```

### 데이터 통계
- **Level 1**: 10개 (ID: 1-10)
- **Level 2**: 34개 (ID: 11-44)
- **Level 3**: 59개 (ID: 45-103)
- **총계**: 103개 카테고리

---

## ✅ 업데이트된 파일

### 1. Database Schema
- **`DATABASE_SCHEMA.md`**
  - `categories` 테이블 정의 수정
  - INTEGER ID 사용으로 변경
  - 실제 데이터 예시 추가
  - 계층 구조 예시 추가

- **`database_tables_structure.csv`**
  - `categories` 테이블 컬럼 수정
  - `problems` 테이블의 category 필드 타입 변경 (TEXT → INTEGER)

- **`database_tables_summary.csv`**
  - 테이블 요약 정보 업데이트
  - 총 카테고리 수 명시 (103개)

### 2. 새로운 파일
- **`src/lib/categories.ts`** (신규 생성)
  - 전체 103개 카테고리 데이터 정의
  - Helper 함수들:
    - `getCategoryById(id)` - ID로 카테고리 조회
    - `getCategoryByName(name)` - 이름으로 카테고리 조회
    - `getLevel1Categories()` - Level 1 카테고리 목록
    - `getLevel2Categories(parentId)` - Level 2 카테고리 목록
    - `getLevel3Categories(parentId)` - Level 3 카테고리 목록
    - `getCategoryPath(l1, l2, l3)` - 전체 경로 생성
    - `findCategoryByName(name)` - AI 매칭용 검색
  - 기존 코드와의 호환성을 위한 `CATEGORIES` export

- **`categories_mapping.md`** (신규 생성)
  - 전체 카테고리 구조 문서화
  - Level별 카테고리 목록 (표 형식)
  - SQL 쿼리 예시
  - Admin 페이지 활용 가이드

- **`CATEGORIES_UPDATE_SUMMARY.md`** (이 파일)
  - 업데이트 내역 요약

### 3. Admin 페이지 수정
- **`src/app/admin/problems/page.tsx`**
  - `src/lib/categories.ts` import 추가
  - 기존 하드코딩된 `CATEGORIES` 객체 제거
  - `selectedLevel3` 상태 추가
  - `matchCategoryFromAI` 함수 리팩토링:
    - 새로운 `findCategoryByName` 사용
    - Level 3 카테고리 매칭 지원
    - 계층 구조 검증 강화
  - `saveProblemToSupabase` 수정:
    - INTEGER category IDs 사용
    - `category_level1/2/3` 필드에 숫자 저장

### 4. 문서 업데이트
- **`IMPLEMENTATION_SUMMARY.md`**
  - 카테고리 정보 업데이트 (103개 명시)
  - INTEGER ID 사용 명시

- **`CATEGORY_MATCHING_GUIDE.md`**
  - 최신 구조 반영 안내 추가
  - `categories_mapping.md` 참조 추가

---

## 🔍 주요 변경점

### Before (이전 가정)
```typescript
// TEXT ID 사용
const CATEGORIES = {
  level1: [
    { id: '1', name: 'Algebra' },
    { id: '2', name: 'Geometry' },
    // ...
  ],
  level2: {
    '1': [
      { id: '1-1', name: 'Elementary Algebra' },
      { id: '1-2', name: 'Linear Algebra' },
      // ...
    ]
  }
};

// 저장 시
category_level1: "1"
category_level2: "1-1"
```

### After (실제 구조)
```typescript
// INTEGER ID 사용
const CATEGORIES_DATA: Category[] = [
  { id: 1, name: 'Algebra', level: 1, parent_id: null },
  { id: 2, name: 'Geometry', level: 1, parent_id: null },
  { id: 11, name: 'Elementary Algebra', level: 2, parent_id: 1 },
  { id: 12, name: 'Linear Algebra', level: 2, parent_id: 1 },
  // ... 총 103개
];

// 저장 시
category_level1: 1       // INTEGER
category_level2: 11      // INTEGER
category_level3: 45      // INTEGER
```

---

## 📖 참고 문서

1. **`categories_rows.csv`** - 원본 Supabase 데이터
2. **`categories_mapping.md`** - 전체 카테고리 매핑 가이드
3. **`DATABASE_SCHEMA.md`** - 전체 DB 스키마
4. **`database_tables_structure.csv`** - 테이블 구조 상세
5. **`src/lib/categories.ts`** - 카테고리 데이터 및 Helper 함수

---

## ✨ 다음 단계

### Admin 페이지 UI 업데이트 (선택사항)
Admin 페이지의 카테고리 선택 UI를 개선할 수 있습니다:

1. **Level 1 선택 → Level 2 옵션 동적 로드**
2. **Level 2 선택 → Level 3 옵션 동적 로드**
3. **선택된 카테고리 경로 실시간 표시**

```typescript
// 예시 코드
const handleLevel1Change = (l1Id: string) => {
  setSelectedLevel1(l1Id);
  setSelectedLevel2("");
  setSelectedLevel3("");
  
  const l2Options = getLevel2Categories(parseInt(l1Id));
  // UI 업데이트
};
```

### Supabase에서 카테고리 로드 (선택사항)
현재는 `src/lib/categories.ts`에 하드코딩된 데이터를 사용하지만, 실시간으로 Supabase에서 로드하도록 변경할 수 있습니다:

```typescript
// src/lib/supabase.ts에 추가
export const categoriesAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('category_id');
    if (error) throw error;
    return data;
  },
  
  getByLevel: async (level: number) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('level', level)
      .order('category_id');
    if (error) throw error;
    return data;
  },
  
  getChildren: async (parentId: number) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('category_id');
    if (error) throw error;
    return data;
  }
};
```

---

## 🎯 결론

✅ **모든 문서와 코드가 실제 Supabase categories 구조와 일치합니다**
- INTEGER ID 사용
- 103개 카테고리 (L1: 10, L2: 34, L3: 59)
- 명확한 계층 구조 (parent_id)

✅ **Admin 페이지가 올바른 데이터 타입으로 저장합니다**
- category_level1/2/3: INTEGER
- category_path: TEXT (표시용)

✅ **AI 카테고리 매칭이 실제 DB와 연동됩니다**
- `findCategoryByName()` 함수로 지능형 검색
- 계층 구조 검증

모든 준비가 완료되었습니다! 🚀

