-- Categories Table Sample Data
-- MathComm Project - 수학 문제 카테고리 계층 구조

-- ==========================================
-- Level 1: 주요 수학 분야 (10개)
-- ==========================================

INSERT INTO categories (id, name, level, description, display_order) VALUES
  ('1', 'Algebra', 1, '대수학 - 방정식, 부등식, 함수 등', 1),
  ('2', 'Geometry', 1, '기하학 - 도형, 공간, 변환 등', 2),
  ('3', 'Analysis', 1, '해석학 - 미적분, 극한, 수열 등', 3),
  ('4', 'Number Theory', 1, '정수론 - 소수, 약수, 나머지 등', 4),
  ('5', 'Combinatorics & Discrete Mathematics', 1, '조합론 및 이산수학', 5),
  ('6', 'Probability & Statistics', 1, '확률과 통계', 6),
  ('7', 'Optimization Theory', 1, '최적화 이론', 7),
  ('8', 'Numerical Analysis', 1, '수치해석', 8),
  ('9', 'Cryptography', 1, '암호학', 9),
  ('10', 'Game Theory', 1, '게임이론', 10);

-- ==========================================
-- Level 2: 세부 분야
-- ==========================================

-- Algebra (대수학)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('1-1', 'Elementary Algebra', 2, '1', 1),
  ('1-2', 'Linear Algebra', 2, '1', 2),
  ('1-3', 'Abstract Algebra', 2, '1', 3);

-- Geometry (기하학)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('2-1', 'Euclidean Geometry', 2, '2', 1),
  ('2-2', 'Analytic Geometry', 2, '2', 2),
  ('2-3', 'Differential Geometry', 2, '2', 3),
  ('2-4', 'Topology', 2, '2', 4);

-- Analysis (해석학)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('3-1', 'Calculus', 2, '3', 1),
  ('3-2', 'Complex Analysis', 2, '3', 2),
  ('3-3', 'Real Analysis', 2, '3', 3),
  ('3-4', 'Differential Equations', 2, '3', 4);

-- Number Theory (정수론)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('4-1', 'Elementary Number Theory', 2, '4', 1),
  ('4-2', 'Analytic Number Theory', 2, '4', 2);

-- Combinatorics (조합론)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('5-1', 'Counting Techniques', 2, '5', 1),
  ('5-2', 'Graph Theory', 2, '5', 2),
  ('5-3', 'Combinatorial Optimization', 2, '5', 3);

-- Probability & Statistics (확률과 통계)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('6-1', 'Probability', 2, '6', 1),
  ('6-2', 'Statistics', 2, '6', 2);

-- ==========================================
-- Level 3: 구체적 주제
-- ==========================================

-- Elementary Algebra (기초 대수학)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('1-1-1', 'Polynomials', 3, '1-1', 1),
  ('1-1-2', 'Equations and Inequalities', 3, '1-1', 2),
  ('1-1-3', 'Factorization', 3, '1-1', 3),
  ('1-1-4', 'Exponents and Logarithms', 3, '1-1', 4),
  ('1-1-5', 'Functions', 3, '1-1', 5),
  ('1-1-6', 'Sequences and Series', 3, '1-1', 6);

-- Linear Algebra (선형대수학)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('1-2-1', 'Matrices', 3, '1-2', 1),
  ('1-2-2', 'Vector Spaces', 3, '1-2', 2),
  ('1-2-3', 'Linear Transformations', 3, '1-2', 3),
  ('1-2-4', 'Eigenvalues and Eigenvectors', 3, '1-2', 4);

-- Euclidean Geometry (유클리드 기하학)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('2-1-1', 'Triangles', 3, '2-1', 1),
  ('2-1-2', 'Circles', 3, '2-1', 2),
  ('2-1-3', 'Polygons', 3, '2-1', 3),
  ('2-1-4', 'Solid Geometry', 3, '2-1', 4);

-- Calculus (미적분)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('3-1-1', 'Limits and Continuity', 3, '3-1', 1),
  ('3-1-2', 'Differentiation', 3, '3-1', 2),
  ('3-1-3', 'Integration', 3, '3-1', 3),
  ('3-1-4', 'Series', 3, '3-1', 4),
  ('3-1-5', 'Multivariable Calculus', 3, '3-1', 5);

-- Elementary Number Theory (기초 정수론)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('4-1-1', 'Divisibility', 3, '4-1', 1),
  ('4-1-2', 'Prime Numbers', 3, '4-1', 2),
  ('4-1-3', 'GCD and LCM', 3, '4-1', 3),
  ('4-1-4', 'Modular Arithmetic', 3, '4-1', 4),
  ('4-1-5', 'Diophantine Equations', 3, '4-1', 5);

-- Counting Techniques (계수법)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('5-1-1', 'Permutations', 3, '5-1', 1),
  ('5-1-2', 'Combinations', 3, '5-1', 2),
  ('5-1-3', 'Binomial Theorem', 3, '5-1', 3),
  ('5-1-4', 'Pigeonhole Principle', 3, '5-1', 4);

-- Probability (확률)
INSERT INTO categories (id, name, level, parent_category_id, display_order) VALUES
  ('6-1-1', 'Basic Probability', 3, '6-1', 1),
  ('6-1-2', 'Conditional Probability', 3, '6-1', 2),
  ('6-1-3', 'Random Variables', 3, '6-1', 3),
  ('6-1-4', 'Distributions', 3, '6-1', 4);

-- ==========================================
-- 유용한 조회 쿼리
-- ==========================================

-- 전체 카테고리 계층 구조 조회
-- SELECT 
--   REPEAT('  ', level - 1) || name as category_tree,
--   id,
--   level,
--   parent_category_id
-- FROM categories
-- ORDER BY id;

-- 특정 Level 1 카테고리의 하위 카테고리 조회
-- SELECT 
--   c1.name as level1,
--   c2.name as level2,
--   c3.name as level3
-- FROM categories c1
-- LEFT JOIN categories c2 ON c2.parent_category_id = c1.id
-- LEFT JOIN categories c3 ON c3.parent_category_id = c2.id
-- WHERE c1.level = 1
-- ORDER BY c1.display_order, c2.display_order, c3.display_order;

-- 카테고리별 문제 수 조회
-- SELECT 
--   c.name,
--   c.level,
--   COUNT(p.id) as problem_count
-- FROM categories c
-- LEFT JOIN problems p ON (
--   p.category_level1 = c.id OR
--   p.category_level2 = c.id OR
--   p.category_level3 = c.id
-- )
-- GROUP BY c.id, c.name, c.level
-- ORDER BY c.level, c.display_order;

