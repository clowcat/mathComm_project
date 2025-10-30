// Real categories from Supabase (categories_rows.csv)
// Total: 103 categories (Level 1: 10, Level 2: 34, Level 3: 59)

export interface Category {
  id: number;
  name: string;
  level: number;
  parent_id: number | null;
}

export const CATEGORIES_DATA: Category[] = [
  // Level 1 (10 categories: 1-10)
  { id: 1, name: 'Algebra', level: 1, parent_id: null },
  { id: 2, name: 'Geometry', level: 1, parent_id: null },
  { id: 3, name: 'Analysis', level: 1, parent_id: null },
  { id: 4, name: 'Number Theory', level: 1, parent_id: null },
  { id: 5, name: 'Combinatorics & Discrete Mathematics', level: 1, parent_id: null },
  { id: 6, name: 'Probability & Statistics', level: 1, parent_id: null },
  { id: 7, name: 'Optimization Theory', level: 1, parent_id: null },
  { id: 8, name: 'Numerical Analysis', level: 1, parent_id: null },
  { id: 9, name: 'Cryptography', level: 1, parent_id: null },
  { id: 10, name: 'Game Theory', level: 1, parent_id: null },

  // Level 2 (34 categories: 11-44)
  // Algebra (1)
  { id: 11, name: 'Elementary Algebra', level: 2, parent_id: 1 },
  { id: 12, name: 'Linear Algebra', level: 2, parent_id: 1 },
  { id: 13, name: 'Abstract Algebra', level: 2, parent_id: 1 },
  
  // Geometry (2)
  { id: 14, name: 'Euclidean Geometry', level: 2, parent_id: 2 },
  { id: 15, name: 'Analytic Geometry', level: 2, parent_id: 2 },
  { id: 16, name: 'Differential Geometry', level: 2, parent_id: 2 },
  { id: 17, name: 'Topology', level: 2, parent_id: 2 },
  
  // Analysis (3)
  { id: 18, name: 'Calculus', level: 2, parent_id: 3 },
  { id: 19, name: 'Complex Analysis', level: 2, parent_id: 3 },
  { id: 20, name: 'Real Analysis', level: 2, parent_id: 3 },
  { id: 21, name: 'Differential Equations', level: 2, parent_id: 3 },
  
  // Number Theory (4)
  { id: 22, name: 'Elementary Number Theory', level: 2, parent_id: 4 },
  { id: 23, name: 'Analytic Number Theory', level: 2, parent_id: 4 },
  
  // Combinatorics & Discrete Mathematics (5)
  { id: 24, name: 'Enumeration', level: 2, parent_id: 5 },
  { id: 25, name: 'Graph Theory', level: 2, parent_id: 5 },
  { id: 26, name: 'Logic and Set Theory', level: 2, parent_id: 5 },
  
  // Probability & Statistics (6)
  { id: 27, name: 'Probability', level: 2, parent_id: 6 },
  { id: 28, name: 'Statistics', level: 2, parent_id: 6 },
  
  // Optimization Theory (7)
  { id: 29, name: 'Linear Programming', level: 2, parent_id: 7 },
  { id: 30, name: 'Integer Programming', level: 2, parent_id: 7 },
  { id: 31, name: 'Network Optimization', level: 2, parent_id: 7 },
  { id: 32, name: 'Dynamic Programming', level: 2, parent_id: 7 },
  
  // Numerical Analysis (8)
  { id: 33, name: 'Root-finding Algorithms', level: 2, parent_id: 8 },
  { id: 34, name: 'Numerical Integration and Differentiation', level: 2, parent_id: 8 },
  { id: 35, name: 'Interpolation', level: 2, parent_id: 8 },
  { id: 36, name: 'Numerical Linear Algebra', level: 2, parent_id: 8 },
  
  // Cryptography (9)
  { id: 37, name: 'Classical Ciphers', level: 2, parent_id: 9 },
  { id: 38, name: 'Public-key Cryptography', level: 2, parent_id: 9 },
  { id: 39, name: 'Hash Functions', level: 2, parent_id: 9 },
  { id: 40, name: 'Cryptographic Protocols', level: 2, parent_id: 9 },
  
  // Game Theory (10)
  { id: 41, name: 'Zero-sum Games', level: 2, parent_id: 10 },
  { id: 42, name: 'Nash Equilibrium', level: 2, parent_id: 10 },
  { id: 43, name: 'Cooperative and Non-cooperative Games', level: 2, parent_id: 10 },
  { id: 44, name: 'Auction Theory', level: 2, parent_id: 10 },

  // Level 3 (59 categories: 45-103)
  // Elementary Algebra (11)
  { id: 45, name: 'Polynomials', level: 3, parent_id: 11 },
  { id: 46, name: 'Equations and Inequalities', level: 3, parent_id: 11 },
  { id: 47, name: 'Factorization', level: 3, parent_id: 11 },
  { id: 48, name: 'Exponents and Logarithms', level: 3, parent_id: 11 },
  
  // Linear Algebra (12)
  { id: 49, name: 'Matrices and Determinants', level: 3, parent_id: 12 },
  { id: 50, name: 'Vector Spaces', level: 3, parent_id: 12 },
  { id: 51, name: 'Linear Transformations', level: 3, parent_id: 12 },
  { id: 52, name: 'Eigenvalues and Eigenvectors', level: 3, parent_id: 12 },
  
  // Abstract Algebra (13)
  { id: 53, name: 'Group Theory', level: 3, parent_id: 13 },
  { id: 54, name: 'Ring Theory', level: 3, parent_id: 13 },
  { id: 55, name: 'Field Theory', level: 3, parent_id: 13 },
  { id: 56, name: 'Galois Theory', level: 3, parent_id: 13 },
  
  // Euclidean Geometry (14)
  { id: 57, name: 'Plane Figures', level: 3, parent_id: 14 },
  { id: 58, name: 'Solid Figures', level: 3, parent_id: 14 },
  { id: 59, name: 'Trigonometry', level: 3, parent_id: 14 },
  { id: 60, name: 'Congruence and Similarity', level: 3, parent_id: 14 },
  
  // Analytic Geometry (15)
  { id: 61, name: 'Coordinate Systems', level: 3, parent_id: 15 },
  { id: 62, name: 'Equations of Lines and Planes', level: 3, parent_id: 15 },
  { id: 63, name: 'Conic Sections', level: 3, parent_id: 15 },
  
  // Differential Geometry (16)
  { id: 64, name: 'Theory of Curves', level: 3, parent_id: 16 },
  { id: 65, name: 'Theory of Surfaces', level: 3, parent_id: 16 },
  
  // Topology (17)
  { id: 66, name: 'Basic Topological Concepts', level: 3, parent_id: 17 },
  { id: 67, name: 'Continuity and Connectedness', level: 3, parent_id: 17 },
  
  // Calculus (18)
  { id: 68, name: 'Limits and Continuity', level: 3, parent_id: 18 },
  { id: 69, name: 'Differentiation', level: 3, parent_id: 18 },
  { id: 70, name: 'Integration', level: 3, parent_id: 18 },
  { id: 71, name: 'Series', level: 3, parent_id: 18 },
  
  // Complex Analysis (19)
  { id: 72, name: 'Complex Numbers and Plane', level: 3, parent_id: 19 },
  { id: 73, name: 'Analytic Functions', level: 3, parent_id: 19 },
  { id: 74, name: "Cauchy's Integral Theorem", level: 3, parent_id: 19 },
  { id: 75, name: 'Residue Theorem', level: 3, parent_id: 19 },
  
  // Real Analysis (20)
  { id: 76, name: 'Measure Theory', level: 3, parent_id: 20 },
  { id: 77, name: 'Lebesgue Integration', level: 3, parent_id: 20 },
  { id: 78, name: 'Function Spaces', level: 3, parent_id: 20 },
  
  // Differential Equations (21)
  { id: 79, name: 'Ordinary Differential Equations', level: 3, parent_id: 21 },
  { id: 80, name: 'Partial Differential Equations', level: 3, parent_id: 21 },
  
  // Elementary Number Theory (22)
  { id: 81, name: 'Primes and Prime Factorization', level: 3, parent_id: 22 },
  { id: 82, name: 'Congruences', level: 3, parent_id: 22 },
  { id: 83, name: 'Diophantine Equations', level: 3, parent_id: 22 },
  
  // Analytic Number Theory (23)
  { id: 84, name: 'Prime Number Theorem', level: 3, parent_id: 23 },
  { id: 85, name: 'Riemann Zeta Function', level: 3, parent_id: 23 },
  
  // Enumeration (24)
  { id: 86, name: 'Permutations and Combinations', level: 3, parent_id: 24 },
  { id: 87, name: 'Generating Functions', level: 3, parent_id: 24 },
  { id: 88, name: 'Inclusion-Exclusion Principle', level: 3, parent_id: 24 },
  
  // Graph Theory (25)
  { id: 89, name: 'Basic Properties of Graphs', level: 3, parent_id: 25 },
  { id: 90, name: 'Trees', level: 3, parent_id: 25 },
  { id: 91, name: 'Paths and Cycles', level: 3, parent_id: 25 },
  { id: 92, name: 'Graph Coloring', level: 3, parent_id: 25 },
  
  // Logic and Set Theory (26)
  { id: 93, name: 'Propositional Logic', level: 3, parent_id: 26 },
  { id: 94, name: 'Predicate Logic', level: 3, parent_id: 26 },
  { id: 95, name: 'Set Operations', level: 3, parent_id: 26 },
  
  // Probability (27)
  { id: 96, name: 'Basic Laws of Probability', level: 3, parent_id: 27 },
  { id: 97, name: 'Conditional Probability and Independence', level: 3, parent_id: 27 },
  { id: 98, name: 'Random Variables and Distributions', level: 3, parent_id: 27 },
  { id: 99, name: 'Expected Value and Variance', level: 3, parent_id: 27 },
  
  // Statistics (28)
  { id: 100, name: 'Descriptive Statistics', level: 3, parent_id: 28 },
  { id: 101, name: 'Estimation and Hypothesis Testing', level: 3, parent_id: 28 },
  { id: 102, name: 'Regression Analysis', level: 3, parent_id: 28 },
];

// Helper functions
export const getCategoryById = (id: number): Category | undefined => {
  return CATEGORIES_DATA.find(cat => cat.id === id);
};

export const getCategoryByName = (name: string): Category | undefined => {
  return CATEGORIES_DATA.find(cat => cat.name.toLowerCase() === name.toLowerCase());
};

export const getLevel1Categories = (): Category[] => {
  return CATEGORIES_DATA.filter(cat => cat.level === 1);
};

export const getLevel2Categories = (parentId: number): Category[] => {
  return CATEGORIES_DATA.filter(cat => cat.level === 2 && cat.parent_id === parentId);
};

export const getLevel3Categories = (parentId: number): Category[] => {
  return CATEGORIES_DATA.filter(cat => cat.level === 3 && cat.parent_id === parentId);
};

export const getCategoryPath = (level1Id: number | null, level2Id: number | null, level3Id: number | null): string => {
  const parts: string[] = [];
  
  if (level1Id) {
    const l1 = getCategoryById(level1Id);
    if (l1) parts.push(l1.name);
  }
  
  if (level2Id) {
    const l2 = getCategoryById(level2Id);
    if (l2) parts.push(l2.name);
  }
  
  if (level3Id) {
    const l3 = getCategoryById(level3Id);
    if (l3) parts.push(l3.name);
  }
  
  return parts.join(' > ');
};

// For AI category matching
export const findCategoryByName = (name: string): Category | null => {
  const normalized = name.toLowerCase().trim();
  
  // Exact match
  const exactMatch = CATEGORIES_DATA.find(cat => cat.name.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;
  
  // Partial match
  const partialMatch = CATEGORIES_DATA.find(cat => 
    cat.name.toLowerCase().includes(normalized) || 
    normalized.includes(cat.name.toLowerCase())
  );
  
  return partialMatch || null;
};

// Structured categories for UI (backward compatibility)
export const CATEGORIES = {
  level1: getLevel1Categories().map(c => ({ id: c.id.toString(), name: c.name })),
  level2: Object.fromEntries(
    getLevel1Categories().map(l1 => [
      l1.id.toString(),
      getLevel2Categories(l1.id).map(c => ({ id: c.id.toString(), name: c.name }))
    ])
  ),
  level3: Object.fromEntries(
    CATEGORIES_DATA
      .filter(c => c.level === 2)
      .map(l2 => [
        l2.id.toString(),
        getLevel3Categories(l2.id).map(c => ({ id: c.id.toString(), name: c.name }))
      ])
  ),
};

