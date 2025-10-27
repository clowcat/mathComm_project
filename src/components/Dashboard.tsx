// Dashboard Component - Main overview page for MathQuest
// Displays user progress, skill tree, recommended problems, and leaderboard

"use client"
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Crown, Flame, Brain, BookOpen, Search, MessageSquare, Users, Trophy, LineChart, LayoutDashboard, Network, Library, Send, Lock, Unlock, Star } from "lucide-react";
import { useLearningSync } from "@/lib/learningSync";

// ------------------------------------------------------------
// Mock Data - In a real app, this would come from an API
// ------------------------------------------------------------

// User mastery data by mathematical topic
const masteryByTopic = [
  { topic: "Algebra", percent: 78 },
  { topic: "Number Theory", percent: 56 },
  { topic: "Geometry", percent: 42 },
  { topic: "Combinatorics", percent: 61 },
];

// Weekly leaderboard data
const leaderboard = [
  { name: "Ada L.", xp: 12450, streak: 21 },
  { name: "Carl F.", xp: 11880, streak: 12 },
  { name: "M. Seo", xp: 10320, streak: 8 },
  { name: "Noether E.", xp: 9920, streak: 5 },
];

// Magic Square Learning Path - Skill Tree Nodes
const skillNodes = [
  { 
    id: "magic-basics", 
    label: "Magic Square Basics", 
    x: 100, 
    y: 40, 
    unlocked: true, 
    level: "Beginner",
    age: "8-9",
    problems: [1001, 1002],
    description: "Learn the fundamentals of magic squares"
  },
  { 
    id: "magic-patterns", 
    label: "Pattern Recognition", 
    x: 300, 
    y: 40, 
    unlocked: true, 
    level: "Intermediate",
    age: "9-11",
    problems: [1003, 1004],
    description: "Discover patterns in magic squares"
  },
  { 
    id: "magic-challenge", 
    label: "Magic Square Challenge", 
    x: 530, 
    y: 80, 
    unlocked: true, 
    level: "Advanced",
    age: "10-12",
    problems: [1005],
    description: "Solve complex magic square problems"
  },
  { 
    id: "moems-contest", 
    label: "MOEMS Contest", 
    x: 750, 
    y: 120, 
    unlocked: true, 
    level: "Olympiad",
    age: "11-13",
    problems: [2024],
    description: "Tackle real MOEMS contest problems"
  },
  { 
    id: "magic-advanced", 
    label: "Advanced Magic Squares", 
    x: 530, 
    y: 180, 
    unlocked: false, 
    level: "Expert",
    age: "12-14",
    problems: [],
    description: "Master advanced magic square techniques"
  },
  { 
    id: "magic-olympiad", 
    label: "Olympiad Magic Squares", 
    x: 660, 
    y: 270, 
    unlocked: false, 
    level: "Master",
    age: "13-15",
    problems: [],
    description: "Solve Olympiad-level magic square problems"
  },
];

// Magic Square Learning Path - Skill Tree Connections
const skillEdges = [
  ["magic-basics", "magic-patterns"],
  ["magic-patterns", "magic-challenge"],
  ["magic-challenge", "moems-contest"],
  ["moems-contest", "magic-advanced"],
  ["magic-advanced", "magic-olympiad"],
];

// Magic Square Problems Data (same as in Problems component)
const magicSquareProblems = [
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
    content: "If all the numbers in a 3×3 magic square add up to 90, what is the magic constant (the sum of each row/column/diagonal)?",
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
    hint: "The center number is always magic constant ÷ 3"
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
    content: "A 3×3 magic square is a grid where the sum of numbers in each row, column, and both diagonals is the same. If the center number is 15 and the sum of all nine numbers is 135, what is the magic constant (the sum of each row/column/diagonal)?",
    hint: "Use the relationship: Magic Constant = Total Sum ÷ Number of Rows"
  }
];

// Get recommended problems from the current skill tree progression
const getRecommendedProblems = () => {
  const unlockedNodes = skillNodes.filter(node => node.unlocked);
  const allProblems: any[] = [];
  
  unlockedNodes.forEach(node => {
    node.problems.forEach(problemId => {
      const problem = magicSquareProblems.find(p => p.id === problemId);
      if (problem) {
        allProblems.push(problem);
      }
    });
  });
  
  return allProblems.slice(0, 3); // Show first 3 available problems
};

// ------------------------------------------------------------
// Reusable UI Components
// ------------------------------------------------------------

/**
 * StatBar Component - Displays a progress bar with label and percentage
 * @param label - Text label for the stat
 * @param value - Percentage value (0-100)
 */
function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs"><span>{label}</span><span className="font-mono">{value}%</span></div>
      <Progress value={value} />
    </div>
  );
}

/**
 * MasteryChart Component - Bar chart showing user's mastery by topic
 * Uses Recharts library for data visualization
 */
function MasteryChart() {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Mastery by Topic</CardTitle></CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={masteryByTopic}>
            <XAxis dataKey="topic" tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="percent" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * LeaderboardCard Component - Shows weekly top performers
 * Displays rank, name, XP, and current streak
 */
function LeaderboardCard() {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Top Solvers (This Week)</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((u, i) => (
            <div key={u.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="w-6 justify-center">{i+1}</Badge>
                <div className="font-medium">{u.name}</div>
              </div>
              <div className="text-sm text-muted-foreground">XP {u.xp} • 🔥 {u.streak}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * RecommendedProblems Component - Shows personalized problem recommendations
 * Displays problems with XP, difficulty, tags, and unlock status
 */
function RecommendedProblems() {
  const recommendedProblems = getRecommendedProblems();
  
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Recommended Problems</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {recommendedProblems.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="mt-0.5 flex flex-wrap gap-1 text-xs text-muted-foreground">
                <span>XP {p.xp}</span>
                <span>•</span>
                <span>{p.difficulty}</span>
                <span>•</span>
                <span>Age {p.age}</span>
                <span>•</span>
          {p.tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {p.unlocked ? <Badge className="bg-emerald-600">Unlocked</Badge> : <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3"/>Locked</Badge>}
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">Open</Button>
                </DialogTrigger>
                <ProblemDialog problem={p} />
              </Dialog>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * ProblemDialog Component - Modal for solving math problems
 * Features two modes: written solution and auto-check
 * @param problem - Problem object with title, XP, difficulty, tags, and unlock status
 */
function ProblemDialog({ problem }: { problem: any }) {
  // State to track which tab is active (write solution or auto-check)
  const [tab, setTab] = React.useState<"write" | "auto">("write");
  
  return (
    <DialogContent className="max-w-6xl w-[90vw] h-[85vh] bg-white border-2 border-gray-200 shadow-2xl overflow-hidden flex flex-col">
      {/* Problem Header Section */}
      <div className="flex-shrink-0">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            {problem.title}
            {problem.unlocked ? <Unlock className="h-5 w-5 text-emerald-600"/> : <Lock className="h-5 w-5 text-red-500"/>}
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-gray-600 mb-3">Topic: Number Theory → Modular Arithmetic</div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs mb-4">
          <Badge className="bg-blue-100 text-blue-800">XP {problem.xp}</Badge>
          <Badge variant="outline" className="border-gray-300 text-gray-700">{problem.difficulty}</Badge>
          {problem.tags.map((t: string) => <Badge key={t} variant="secondary" className="bg-gray-100 text-gray-700">{t}</Badge>)}
        </div>
        <Separator className="my-4"/>
        <div className="prose prose-sm max-w-none mb-6">
          <p className="text-gray-800 leading-relaxed break-words">
            <strong className="text-gray-900">Problem:</strong> Find all integers x such that x ≡ 7 (mod 13) and 5x ≡ 2 (mod 11).
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="bg-gray-100 flex-shrink-0">
            <TabsTrigger value="write" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Write Solution</TabsTrigger>
            <TabsTrigger value="auto" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Auto-check</TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="flex-1 mt-3 overflow-hidden">
            <div className="h-full rounded-xl border-2 border-gray-200 p-4 bg-gray-50 flex flex-col">
              <textarea 
                className="flex-1 w-full min-h-0 resize-none bg-white border border-gray-300 rounded-lg p-4 outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed" 
                placeholder="Type your proof with Markdown/LaTeX…"
              ></textarea>
              <div className="mt-3 flex items-center gap-2 flex-shrink-0">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Submit Solution</Button>
                <Button variant="outline" className="border-gray-300 text-gray-700">Preview</Button>
                <Button variant="ghost" className="gap-1 text-gray-600 hover:text-gray-800"><BookOpen className="h-4 w-4"/> Review Theory</Button>
                <Button variant="ghost" className="gap-1 text-gray-600 hover:text-gray-800"><Star className="h-4 w-4"/> Hint (−10 XP)</Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="auto" className="flex-1 mt-3 overflow-hidden">
            <div className="h-full rounded-xl border-2 border-gray-200 p-4 space-y-3 bg-gray-50 flex flex-col">
              <div className="text-sm text-gray-700">Enter a numeric answer (if applicable):</div>
              <Input placeholder="e.g., 42" className="bg-white border-gray-300" />
              <div className="flex items-center gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Check</Button>
                <span className="text-xs text-gray-500">Auto-grading supports MCQ/short answer</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <Separator className="my-4 flex-shrink-0"/>
        <div className="flex-shrink-0">
          <div className="mb-3 text-sm font-semibold text-gray-900">Discussion</div>
          <div className="rounded-xl border-2 border-gray-200 p-4 space-y-3 max-h-32 overflow-auto bg-gray-50">
            <div className="text-sm text-gray-800"><strong className="text-blue-600">Ada:</strong> Try reducing both congruences to a single modulus via CRT.</div>
            <div className="text-sm text-gray-800"><strong className="text-green-600">M. Seo:</strong> Solved using inverses mod 11 and mod 13, then combined.</div>
            <div className="text-sm text-gray-800"><strong className="text-purple-600">Carl:</strong> A hint: inverse of 5 mod 11 is 9.</div>
            <div className="flex items-center gap-2 pt-2">
              <Input placeholder="Write a comment…" className="bg-white border-gray-300" />
              <Button className="gap-1 bg-blue-600 hover:bg-blue-700 text-white" size="sm"><Send className="h-4 w-4"/>Post</Button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

function SkillTreeCanvas({ onOpenNode }: { onOpenNode?: (id: string) => void }) {
  const { selectedNode, setSelectedNode } = useLearningSync();

  // quick lookup for positions
  const positions = React.useMemo(() => Object.fromEntries(skillNodes.map(n => [n.id, n])), []);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
    if (onOpenNode) onOpenNode(nodeId);
  };

  const selectedNodeData = selectedNode ? skillNodes.find(n => n.id === selectedNode) : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-base">Magic Square Learning Path</CardTitle>
        <div className="flex items-center gap-2">
          <Badge>Progressive</Badge>
          <Badge variant="secondary">Age-Based</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[420px] w-full">
          {/* Edges */}
          <svg className="absolute inset-0 h-full w-full">
            {skillEdges.map(([a, b], idx) => {
              const A = positions[a];
              const B = positions[b];
              return (
                <line key={idx} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#d1d5db" strokeWidth={2} markerEnd="url(#arrow)" />
              );
            })}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#d1d5db" />
              </marker>
            </defs>
          </svg>
          {/* Nodes */}
          {skillNodes.map((n) => (
            <button
              key={n.id}
              onClick={() => handleNodeClick(n.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-3 py-2 shadow-sm backdrop-blur transition-all ${
                n.unlocked ? "bg-white hover:bg-gray-50" : "bg-muted/70"
              } ${selectedNode === n.id ? "ring-2 ring-blue-500" : ""}`}
              style={{ left: n.x, top: n.y }}
            >
              <div className="flex items-center gap-2 text-sm">
                {n.unlocked ? <Unlock className="h-4 w-4 text-emerald-600"/> : <Lock className="h-4 w-4"/>}
                <span className="font-medium">{n.label}</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">{n.level} • Age {n.age}</div>
            </button>
          ))}
        </div>
        
        {/* Selected Node Problems */}
        {selectedNodeData && selectedNodeData.problems.length > 0 && (
          <div className="border-t p-4 bg-gray-50">
            <h4 className="font-semibold text-sm mb-2">{selectedNodeData.label} Problems</h4>
            <p className="text-xs text-muted-foreground mb-3">{selectedNodeData.description}</p>
            <div className="grid gap-4">
              {selectedNodeData.problems.map(problemId => {
                const problem = magicSquareProblems.find(p => p.id === problemId);
                if (!problem) return null;
                
                return (
                  <div key={problemId} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <div className="text-sm font-medium">{problem.title}</div>
                      <div className="text-xs text-muted-foreground">
                        XP {problem.xp} • {problem.difficulty} • Age {problem.age}
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">Solve</Button>
                      </DialogTrigger>
                      <ProblemDialog problem={problem} />
                    </Dialog>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Main Dashboard Component
 * Layout: 3-column grid on desktop, single column on mobile
 * Left side (2/3): User journey, skill tree, recommended problems
 * Right side (1/3): Mastery chart, leaderboard, quick actions
 */
export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-4">
      {/* Main Content Area - Left 2/3 of screen on desktop */}
    <div className="xl:col-span-2 space-y-6">
        {/* User Progress Card */}
    <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Your Journey</CardTitle>
              <div className="mt-1 text-xs text-muted-foreground">Number Theory Explorer – Level 7</div>
            </div>
            <Badge variant="secondary" className="gap-1"><Flame className="h-3 w-3"/>Streak 8</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs mb-1">XP Progress</div>
                <Progress value={62} />
                <div className="mt-1 text-[10px] text-muted-foreground">620/1000 → Level 8</div>
              </div>
              <StatBar label="Skills Unlocked" value={54} />
              <StatBar label="Problems Solved" value={71} />
            </div>
          </CardContent>
        </Card>
        
        {/* Skill Tree Visualization */}
        <SkillTreeCanvas onOpenNode={() => {}} />
        
        {/* Recommended Problems List */}
    <RecommendedProblems />
      </div>
      
      {/* Sidebar - Right 1/3 of screen on desktop */}
      <div className="space-y-4">
        {/* Mastery Progress Chart */}
        <MasteryChart />
        
        {/* Weekly Leaderboard */}
        <LeaderboardCard />
        
        {/* Quick Action Buttons */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm">Continue Learning</Button>
            <Button size="sm" variant="outline">Challenge of the Day</Button>
            <Button size="sm" variant="ghost">Theory Review</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
