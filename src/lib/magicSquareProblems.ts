// Shared Magic Square problem set used across dashboard and problem browser
export type MagicSquareProblem = {
  id: number;
  title: string;
  level: string;
  age: string;
  xp: number;
  difficulty: string;
  tags: string[];
  unlocked: boolean;
  content: string;
  hint?: string;
};

// Progressive Magic Square Problems for Teaching
export const magicSquareProblems: MagicSquareProblem[] = [
  // Level 1: Foundation (Ages 8-9)
  {
    id: 1001,
    title: "Magic Square Basics",
    level: "Beginner",
    age: "8-9",
    xp: 50,
    difficulty: "Easy",
    tags: ["Magic Square", "Addition", "Foundation"],
    unlocked: true,
    content: "Complete this magic square by filling in the missing numbers. Each row, column, and diagonal should add to 15.\n\n[8] [ ] [6]\n[ ] [5] [ ]\n[4] [ ] [2]",
    hint: "Start by adding the numbers in the first row: 8 + ? + 6 = 15"
  },
  {
    id: 1002,
    title: "Magic Square Patterns",
    level: "Beginner",
    age: "8-9",
    xp: 75,
    difficulty: "Easy",
    tags: ["Magic Square", "Patterns", "Foundation"],
    unlocked: true,
    content: "Look at this completed magic square:\n\n[8] [1] [6]\n[3] [5] [7]\n[4] [9] [2]\n\nWhat do you notice about the center number? What about the corner numbers?",
    hint: "The center number is special in magic squares!"
  },

  // Level 2: Pattern Recognition (Ages 9-11)
  {
    id: 1003,
    title: "Finding the Magic Constant",
    level: "Intermediate",
    age: "9-11",
    xp: 100,
    difficulty: "Medium",
    tags: ["Magic Square", "Division", "Patterns"],
    unlocked: true,
    content: "If all the numbers in a 3x3 magic square add up to 90, what is the magic constant (the sum of each row/column/diagonal)?",
    hint: "If the total is 90 and there are 3 rows, what should each row sum to?"
  },
  {
    id: 1004,
    title: "Magic Square Center",
    level: "Intermediate",
    age: "9-11",
    xp: 125,
    difficulty: "Medium",
    tags: ["Magic Square", "Center", "Patterns"],
    unlocked: true,
    content: "In a magic square with magic constant 21, what is the center number?",
    hint: "The center number is always the magic constant / 3"
  },

  // Level 3: Problem-Solving (Ages 10-12)
  {
    id: 1005,
    title: "Magic Square Challenge",
    level: "Advanced",
    age: "10-12",
    xp: 200,
    difficulty: "Hard",
    tags: ["Magic Square", "Logic", "Problem Solving"],
    unlocked: true,
    content: "A magic square has a center number of 12 and a total sum of 108. What is the magic constant?",
    hint: "First find the magic constant, then verify using the center number relationship."
  },

  // Level 4: MOEMS Contest Problem (Ages 11-13)
  {
    id: 2024,
    title: "MOEMS Magic Square Challenge",
    level: "Olympiad",
    age: "11-13",
    xp: 500,
    difficulty: "Olympiad",
    tags: ["Magic Square", "MOEMS", "Contest", "Logic"],
    unlocked: true,
    content: "A 3x3 magic square is a grid where the sum of numbers in each row, column, and both diagonals is the same. If the center number is 15 and the sum of all nine numbers is 135, what is the magic constant (the sum of each row/column/diagonal)?",
    hint: "Use the relationship: Magic Constant = Total Sum / Number of Rows"
  }
];
