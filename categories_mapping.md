# Categories 매핑 가이드

## 📊 실제 Supabase categories 테이블 구조

### 테이블 구조
```sql
CREATE TABLE categories (
  category_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
  parent_id INTEGER REFERENCES categories(category_id)
);
```

### 데이터 통계
- **Level 1**: 10개 카테고리 (ID: 1-10)
- **Level 2**: 34개 카테고리 (ID: 11-44)
- **Level 3**: 59개 카테고리 (ID: 45-103)
- **총합**: 103개 카테고리

---

## 📋 Level 1 카테고리 (10개)

| ID | Name | 설명 |
|----|------|------|
| 1 | Algebra | 대수학 |
| 2 | Geometry | 기하학 |
| 3 | Analysis | 해석학 |
| 4 | Number Theory | 정수론 |
| 5 | Combinatorics & Discrete Mathematics | 조합론 및 이산수학 |
| 6 | Probability & Statistics | 확률과 통계 |
| 7 | Optimization Theory | 최적화 이론 |
| 8 | Numerical Analysis | 수치해석 |
| 9 | Cryptography | 암호학 |
| 10 | Game Theory | 게임이론 |

---

## 📋 Level 2 카테고리 (34개)

### Algebra (1) - 3개
| ID | Name | Parent |
|----|------|--------|
| 11 | Elementary Algebra | 1 |
| 12 | Linear Algebra | 1 |
| 13 | Abstract Algebra | 1 |

### Geometry (2) - 4개
| ID | Name | Parent |
|----|------|--------|
| 14 | Euclidean Geometry | 2 |
| 15 | Analytic Geometry | 2 |
| 16 | Differential Geometry | 2 |
| 17 | Topology | 2 |

### Analysis (3) - 4개
| ID | Name | Parent |
|----|------|--------|
| 18 | Calculus | 3 |
| 19 | Complex Analysis | 3 |
| 20 | Real Analysis | 3 |
| 21 | Differential Equations | 3 |

### Number Theory (4) - 2개
| ID | Name | Parent |
|----|------|--------|
| 22 | Elementary Number Theory | 4 |
| 23 | Analytic Number Theory | 4 |

### Combinatorics & Discrete Mathematics (5) - 3개
| ID | Name | Parent |
|----|------|--------|
| 24 | Enumeration | 5 |
| 25 | Graph Theory | 5 |
| 26 | Logic and Set Theory | 5 |

### Probability & Statistics (6) - 2개
| ID | Name | Parent |
|----|------|--------|
| 27 | Probability | 6 |
| 28 | Statistics | 6 |

### Optimization Theory (7) - 4개
| ID | Name | Parent |
|----|------|--------|
| 29 | Linear Programming | 7 |
| 30 | Integer Programming | 7 |
| 31 | Network Optimization | 7 |
| 32 | Dynamic Programming | 7 |

### Numerical Analysis (8) - 4개
| ID | Name | Parent |
|----|------|--------|
| 33 | Root-finding Algorithms | 8 |
| 34 | Numerical Integration and Differentiation | 8 |
| 35 | Interpolation | 8 |
| 36 | Numerical Linear Algebra | 8 |

### Cryptography (9) - 4개
| ID | Name | Parent |
|----|------|--------|
| 37 | Classical Ciphers | 9 |
| 38 | Public-key Cryptography | 9 |
| 39 | Hash Functions | 9 |
| 40 | Cryptographic Protocols | 9 |

### Game Theory (10) - 4개
| ID | Name | Parent |
|----|------|--------|
| 41 | Zero-sum Games | 10 |
| 42 | Nash Equilibrium | 10 |
| 43 | Cooperative and Non-cooperative Games | 10 |
| 44 | Auction Theory | 10 |

---

## 📋 Level 3 카테고리 (59개)

### Elementary Algebra (11) - 4개
| ID | Name |
|----|------|
| 45 | Polynomials |
| 46 | Equations and Inequalities |
| 47 | Factorization |
| 48 | Exponents and Logarithms |

### Linear Algebra (12) - 4개
| ID | Name |
|----|------|
| 49 | Matrices and Determinants |
| 50 | Vector Spaces |
| 51 | Linear Transformations |
| 52 | Eigenvalues and Eigenvectors |

### Abstract Algebra (13) - 4개
| ID | Name |
|----|------|
| 53 | Group Theory |
| 54 | Ring Theory |
| 55 | Field Theory |
| 56 | Galois Theory |

### Euclidean Geometry (14) - 4개
| ID | Name |
|----|------|
| 57 | Plane Figures |
| 58 | Solid Figures |
| 59 | Trigonometry |
| 60 | Congruence and Similarity |

### Analytic Geometry (15) - 3개
| ID | Name |
|----|------|
| 61 | Coordinate Systems |
| 62 | Equations of Lines and Planes |
| 63 | Conic Sections |

### Differential Geometry (16) - 2개
| ID | Name |
|----|------|
| 64 | Theory of Curves |
| 65 | Theory of Surfaces |

### Topology (17) - 2개
| ID | Name |
|----|------|
| 66 | Basic Topological Concepts |
| 67 | Continuity and Connectedness |

### Calculus (18) - 4개
| ID | Name |
|----|------|
| 68 | Limits and Continuity |
| 69 | Differentiation |
| 70 | Integration |
| 71 | Series |

### Complex Analysis (19) - 4개
| ID | Name |
|----|------|
| 72 | Complex Numbers and Plane |
| 73 | Analytic Functions |
| 74 | Cauchy's Integral Theorem |
| 75 | Residue Theorem |

### Real Analysis (20) - 3개
| ID | Name |
|----|------|
| 76 | Measure Theory |
| 77 | Lebesgue Integration |
| 78 | Function Spaces |

### Differential Equations (21) - 2개
| ID | Name |
|----|------|
| 79 | Ordinary Differential Equations |
| 80 | Partial Differential Equations |

### Elementary Number Theory (22) - 3개
| ID | Name |
|----|------|
| 81 | Primes and Prime Factorization |
| 82 | Congruences |
| 83 | Diophantine Equations |

### Analytic Number Theory (23) - 2개
| ID | Name |
|----|------|
| 84 | Prime Number Theorem |
| 85 | Riemann Zeta Function |

### Enumeration (24) - 3개
| ID | Name |
|----|------|
| 86 | Permutations and Combinations |
| 87 | Generating Functions |
| 88 | Inclusion-Exclusion Principle |

### Graph Theory (25) - 4개
| ID | Name |
|----|------|
| 89 | Basic Properties of Graphs |
| 90 | Trees |
| 91 | Paths and Cycles |
| 92 | Graph Coloring |

### Logic and Set Theory (26) - 3개
| ID | Name |
|----|------|
| 93 | Propositional Logic |
| 94 | Predicate Logic |
| 95 | Set Operations |

### Probability (27) - 4개
| ID | Name |
|----|------|
| 96 | Basic Laws of Probability |
| 97 | Conditional Probability and Independence |
| 98 | Random Variables and Distributions |
| 99 | Expected Value and Variance |

### Statistics (28) - 3개
| ID | Name |
|----|------|
| 100 | Descriptive Statistics |
| 101 | Estimation and Hypothesis Testing |
| 102 | Regression Analysis |

---

## 🔍 카테고리 조회 쿼리

### 1. 전체 계층 구조 조회
```sql
SELECT 
  c1.category_id as level1_id,
  c1.name as level1_name,
  c2.category_id as level2_id,
  c2.name as level2_name,
  c3.category_id as level3_id,
  c3.name as level3_name
FROM categories c1
LEFT JOIN categories c2 ON c2.parent_id = c1.category_id
LEFT JOIN categories c3 ON c3.parent_id = c2.category_id
WHERE c1.level = 1
ORDER BY c1.category_id, c2.category_id, c3.category_id;
```

### 2. 특정 카테고리의 전체 경로 조회
```sql
WITH RECURSIVE category_path AS (
  SELECT 
    category_id, 
    name, 
    level, 
    parent_id,
    name::TEXT as path
  FROM categories
  WHERE category_id = 45  -- Polynomials
  
  UNION ALL
  
  SELECT 
    c.category_id, 
    c.name, 
    c.level, 
    c.parent_id,
    c.name || ' > ' || cp.path
  FROM categories c
  JOIN category_path cp ON c.category_id = cp.parent_id
)
SELECT path FROM category_path WHERE level = 1;
-- Result: "Algebra > Elementary Algebra > Polynomials"
```

### 3. 특정 Level 1의 하위 카테고리 개수
```sql
SELECT 
  c1.category_id,
  c1.name,
  COUNT(DISTINCT c2.category_id) as level2_count,
  COUNT(DISTINCT c3.category_id) as level3_count
FROM categories c1
LEFT JOIN categories c2 ON c2.parent_id = c1.category_id
LEFT JOIN categories c3 ON c3.parent_id = c2.category_id
WHERE c1.level = 1
GROUP BY c1.category_id, c1.name
ORDER BY c1.category_id;
```

---

## 💡 Admin 페이지 활용

### Admin UI에서 카테고리 선택 시

```typescript
// 1. Level 1 카테고리 로드
const level1Categories = await supabase
  .from('categories')
  .select('category_id, name')
  .eq('level', 1)
  .order('category_id');

// 2. Level 2 카테고리 로드 (Level 1 선택 후)
const level2Categories = await supabase
  .from('categories')
  .select('category_id, name')
  .eq('level', 2)
  .eq('parent_id', selectedLevel1)
  .order('category_id');

// 3. Level 3 카테고리 로드 (Level 2 선택 후)
const level3Categories = await supabase
  .from('categories')
  .select('category_id, name')
  .eq('level', 3)
  .eq('parent_id', selectedLevel2)
  .order('category_id');

// 4. 전체 경로 생성
const categoryPath = `${level1Name} > ${level2Name} > ${level3Name}`;

// 5. problems 테이블에 저장
await supabase
  .from('problems')
  .insert({
    title: problemTitle,
    category_level1: selectedLevel1,  // INTEGER: 1-10
    category_level2: selectedLevel2,  // INTEGER: 11-44
    category_level3: selectedLevel3,  // INTEGER: 45-103
    category_path: categoryPath,      // TEXT: "Algebra > Elementary Algebra > Polynomials"
    // ... 기타 필드
  });
```

---

## 📚 참고

- **categories_rows.csv** - 전체 카테고리 데이터
- **DATABASE_SCHEMA.md** - 전체 DB 스키마
- **Admin 페이지** - `/admin/problems`에서 카테고리 선택 UI 구현 필요

