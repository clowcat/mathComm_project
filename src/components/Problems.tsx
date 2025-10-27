// Problems Component - Browse and solve mathematical problems
// Features problem filtering, detailed problem view, and solution submission

"use client"
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Send, Lock, Unlock, Star, Filter } from "lucide-react";

// Progressive Magic Square Problems for Teaching
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

/**
 * ProblemDialog Component - Modal for solving individual math problems
 * Features two solution modes: written proof and auto-check
 * @param problem - Problem object with metadata and unlock status
 */
function ProblemDialog({ problem }: { problem: any }) {
  // State to track active solution mode (write or auto-check)
  const [tab, setTab] = React.useState<"write" | "auto">("write");
  
  return (
    <DialogContent className="max-w-6xl w-[90vw] h-[85vh] bg-white border-2 border-gray-200 shadow-2xl overflow-hidden flex flex-col">
      {/* Problem Header with metadata */}
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
          <div className="text-gray-800 leading-relaxed break-words whitespace-pre-line">
            <strong className="text-gray-900">Problem:</strong> {problem.content || "Find all integers x such that x ≡ 7 (mod 13) and 5x ≡ 2 (mod 11)."}
          </div>
          {problem.hint && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <strong className="text-blue-900">💡 Hint:</strong>
              <span className="text-blue-800 ml-2">{problem.hint}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Solution Interface */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="bg-gray-100 flex-shrink-0">
            <TabsTrigger value="write" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Write Solution</TabsTrigger>
            <TabsTrigger value="auto" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Auto-check</TabsTrigger>
          </TabsList>
          
          {/* Written Solution Tab */}
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
          
          {/* Auto-check Tab */}
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
        
        {/* Discussion Section */}
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

/**
 * Main Problems Component
 * Displays a scrollable list of problems with filtering options
 * Each problem can be opened in a detailed dialog for solving
 */
export default function Problems() {
  // State for filtering
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedAge, setSelectedAge] = useState("All");
  
  // Filter problems based on selected criteria
  const filteredProblems = magicSquareProblems.filter(problem => {
    const levelMatch = selectedLevel === "All" || problem.level === selectedLevel;
    const ageMatch = selectedAge === "All" || problem.age === selectedAge;
    return levelMatch && ageMatch;
  });
  
  // Get unique levels and ages for filter options
  const levels = ["All", ...new Set(magicSquareProblems.map(p => p.level))];
  const ages = ["All", ...new Set(magicSquareProblems.map(p => p.age))];
  
  return (
    <div className="p-4 space-y-4">
      {/* Header with filtering options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Magic Square Learning Path</div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Filter by:</span>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4">
          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Level:</span>
            <div className="flex gap-1">
              {levels.map(level => (
                <Button
                  key={level}
                  size="sm"
                  variant={selectedLevel === level ? "default" : "outline"}
                  onClick={() => setSelectedLevel(level)}
                  className="text-xs"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Age Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Age:</span>
            <div className="flex gap-1">
              {ages.map(age => (
                <Button
                  key={age}
                  size="sm"
                  variant={selectedAge === age ? "default" : "outline"}
                  onClick={() => setSelectedAge(age)}
                  className="text-xs"
                >
                  {age}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollable problem list */}
      <ScrollArea className="h-[560px] rounded-xl border p-4">
        <div className="grid gap-3">
          {filteredProblems.map((problem) => {
            const isOlympiad = problem.level === "Olympiad";
            const isBeginner = problem.level === "Beginner";
            
            return (
              <div 
                key={problem.id} 
                className={`rounded-xl border p-3 flex items-center justify-between ${
                  isOlympiad ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' :
                  isBeginner ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' :
                  'bg-white'
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium">{problem.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Level: {problem.level} • Age: {problem.age} • XP: {problem.xp} • {problem.difficulty}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {problem.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className={
                        isOlympiad ? "bg-yellow-100 hover:bg-yellow-200" :
                        isBeginner ? "bg-green-100 hover:bg-green-200" :
                        ""
                      }
                    >
                      Open
                    </Button>
                  </DialogTrigger>
                  <ProblemDialog problem={problem} />
                </Dialog>
              </div>
            );
          })}
          
          {/* Show message if no problems match filter */}
          {filteredProblems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No problems match the selected filters. Try adjusting your selection.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
