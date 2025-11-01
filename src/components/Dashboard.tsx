// Dashboard Component - Main overview page for MathQuest
// Displays user progress, skill tree, recommended problems, and leaderboard

"use client"
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Crown, Flame, Brain, BookOpen, Search, MessageSquare, Users, Trophy, LineChart, LayoutDashboard, Network, Library, Send, Lock, Unlock, Star, Loader2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useLearningSync } from "@/lib/learningSync";
import MathPreview from "@/components/MathPreview";
import { problemsAPI, problemRelationshipsAPI, getDifficultyLabel, type Problem as SupabaseProblem } from "@/lib/supabase";

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

// Skill Node Interface
interface SkillNode {
  id: string;
  label: string;
  x: number;
  y: number;
  unlocked: boolean;
  level: string;
  age: string;
  problems: string[]; // Problem IDs from Supabase
  description: string;
}

// Convert Supabase Problem to display format
interface ProblemDisplay {
  id: string;
  title: string;
  level: string;
  age: string;
  xp: number;
  difficulty: string;
  tags: string[];
  unlocked: boolean;
  content: string;
  hint?: string;
  solution?: string;
  category_path?: string;
}

function convertSupabaseProblem(sp: SupabaseProblem): ProblemDisplay {
  return {
    id: sp.id,
    title: sp.title,
    level: sp.level || getDifficultyLabel(sp.difficulty),
    age: sp.age_range || "All Ages",
    xp: sp.xp || sp.difficulty * 50,
    difficulty: getDifficultyLabel(sp.difficulty),
    tags: sp.tags || (sp.category_path ? sp.category_path.split(' > ') : []),
    unlocked: true,
    content: sp.content,
    hint: undefined,
    solution: sp.solution,
    category_path: sp.category_path,
  };
}

// Build hierarchical learning paths based on parent_problem_id (like admin page)
function buildLearningPaths(problems: SupabaseProblem[], relationships: any[]): { nodes: SkillNode[], edges: string[][] } {
  const nodes: SkillNode[] = [];
  const edges: string[][] = [];
  
  // Find root problems (no parent_problem_id)
  const rootProblems = problems.filter(p => !p.parent_problem_id);
  
  if (rootProblems.length === 0) {
    // If no root problems, use all problems as roots
    rootProblems.push(...problems.slice(0, 10));
  }
  
  let rowIndex = 0;
  const level0X = 150;  // Root problems (left)
  const level1X = 450;  // Level 1 derived problems (middle)
  const level2X = 750;  // Level 2 grandchildren (right)
  const ySpacing = 120; // Vertical spacing between root problems
  const ySpacingDerived = 100; // Vertical spacing for derived problems
  const startY = 80;
  
  // Process each root problem and its hierarchy
  rootProblems.slice(0, 8).forEach((rootProblem, rootIdx) => {
    const rootNodeId = `problem-${rootProblem.id}`;
    const level = rootProblem.level || getDifficultyLabel(rootProblem.difficulty);
    
    // Position root problem (Level 0) - left side
    const rootY = startY + (rootIdx * ySpacing);
    
    nodes.push({
      id: rootNodeId,
      label: rootProblem.title.length > 25 ? rootProblem.title.substring(0, 25) + '...' : rootProblem.title,
      x: level0X,
      y: rootY,
      unlocked: true,
      level: level,
      age: rootProblem.age_range || "All Ages",
      problems: [rootProblem.id],
      description: rootProblem.category_path || level,
    });
    
    // Find Level 1: Derived problems (children of root)
    const derivedProblems = problems.filter(p => p.parent_problem_id === rootProblem.id);
    derivedProblems.sort((a, b) => a.difficulty - b.difficulty);
    
    let derivedYOffset = 0;
    derivedProblems.forEach((derived, derivedIdx) => {
      const derivedNodeId = `problem-${derived.id}`;
      const derivedLevel = derived.level || getDifficultyLabel(derived.difficulty);
      
      // Position Level 1 problems (middle column) - vertically aligned with root
      const derivedY = rootY + (derivedYOffset);
      
      nodes.push({
        id: derivedNodeId,
        label: derived.title.length > 25 ? derived.title.substring(0, 25) + '...' : derived.title,
        x: level1X,
        y: derivedY,
        unlocked: true,
        level: derivedLevel,
        age: derived.age_range || "All Ages",
        problems: [derived.id],
        description: derived.category_path || derivedLevel,
      });
      
      // Create edge from root to derived
      edges.push([rootNodeId, derivedNodeId]);
      
      // Find Level 2: Grandchildren (children of derived)
      const grandchildren = problems.filter(p => p.parent_problem_id === derived.id);
      grandchildren.sort((a, b) => a.difficulty - b.difficulty);
      
      grandchildren.forEach((grandchild, gcIdx) => {
        const grandchildNodeId = `problem-${grandchild.id}`;
        const grandchildLevel = grandchild.level || getDifficultyLabel(grandchild.difficulty);
        
        // Position Level 2 problems (right column) - vertically aligned
        const grandchildY = derivedY + (gcIdx * ySpacingDerived);
        
        nodes.push({
          id: grandchildNodeId,
          label: grandchild.title.length > 25 ? grandchild.title.substring(0, 25) + '...' : grandchild.title,
          x: level2X,
          y: grandchildY,
          unlocked: true,
          level: grandchildLevel,
          age: grandchild.age_range || "All Ages",
          problems: [grandchild.id],
          description: grandchild.category_path || grandchildLevel,
        });
        
        // Create edge from derived to grandchild
        edges.push([derivedNodeId, grandchildNodeId]);
      });
      
      // Adjust Y offset for next derived problem
      derivedYOffset += Math.max(100, grandchildren.length * ySpacingDerived) + 20;
    });
    
    // If there are derived problems, adjust spacing
    if (derivedProblems.length > 0) {
      const maxDerivedHeight = derivedProblems.reduce((max, d) => {
        const grandchildren = problems.filter(p => p.parent_problem_id === d.id);
        return Math.max(max, grandchildren.length * ySpacingDerived + 100);
      }, 0);
      
      // Update rowIndex to account for the height of this root's hierarchy
      if (maxDerivedHeight > ySpacing) {
        rowIndex += Math.ceil(maxDerivedHeight / ySpacing);
      }
    }
  });

  return { nodes, edges };
}

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
 * Fetches from Supabase
 */
function RecommendedProblems() {
  const [recommendedProblems, setRecommendedProblems] = useState<ProblemDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendedProblems = async () => {
      try {
        setIsLoading(true);
        // Get all problems ordered by difficulty (easy first)
        const problems = await problemsAPI.getAll();
        const converted = problems
          .map(convertSupabaseProblem)
          .sort((a, b) => {
            // Sort by difficulty level: Beginner -> Intermediate -> Advanced -> Olympiad
            const order: Record<string, number> = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Olympiad': 4 };
            return (order[a.level] || 5) - (order[b.level] || 5);
          })
          .slice(0, 3);
        setRecommendedProblems(converted);
      } catch (err) {
        console.error('Failed to fetch recommended problems:', err);
        setRecommendedProblems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendedProblems();
  }, []);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recommended Problems</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Recommended Problems</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {recommendedProblems.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">No recommended problems available</div>
        ) : (
          recommendedProblems.map((p: ProblemDisplay) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-3 bg-white">
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
        )))}
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
  const [solutionDraft, setSolutionDraft] = React.useState("");
  const [previewVisible, setPreviewVisible] = React.useState(false);
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "loading" | "ready" | "error">("idle");
  const [previewHtml, setPreviewHtml] = React.useState("");
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [previewSource, setPreviewSource] = React.useState("");

  const previewHeaderStatus = React.useMemo(() => {
    if (previewStatus === "loading") return "Rendering…";
    if (previewStatus === "error") return "Error";
    if (previewStatus === "ready" && previewSource !== solutionDraft) return "Needs refresh";
    if (previewStatus === "ready") return "Up to date";
    if (previewVisible) return "Ready";
    return "Awaiting input";
  }, [previewStatus, previewSource, solutionDraft, previewVisible]);

  const handlePreviewClick = React.useCallback(async () => {
    setPreviewVisible(true);

    if (!solutionDraft.trim()) {
      setPreviewStatus("error");
      setPreviewHtml("");
      setPreviewSource("");
      setPreviewError("Start typing your solution to generate a preview.");
      return;
    }

    try {
      setPreviewStatus("loading");
      setPreviewError(null);
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: solutionDraft }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "Preview request failed.");
      }

      const html = typeof (payload as { html?: unknown }).html === "string" ? (payload as { html: string }).html : "";
      setPreviewHtml(html);
      setPreviewStatus("ready");
      setPreviewSource(solutionDraft);
    } catch (error) {
      setPreviewStatus("error");
      setPreviewHtml("");
      setPreviewSource("");
      setPreviewError(error instanceof Error ? error.message : "Unable to render preview.");
    }
  }, [solutionDraft]);
  
  return (
    <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] bg-white border-2 border-gray-200 shadow-2xl overflow-hidden flex flex-col p-0">
      {/* Scrollable Content Container */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-6">
          {/* Problem Header Section */}
          <div className="flex-shrink-0">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                {problem.title}
                {problem.unlocked ? <Unlock className="h-5 w-5 text-blue-600"/> : <Lock className="h-5 w-5 text-red-500"/>}
              </DialogTitle>
            </DialogHeader>
            {problem.category_path && (
              <div className="text-sm text-gray-500 mb-3">Topic: {problem.category_path}</div>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs mb-4">
              <Badge className="bg-blue-600 text-white">XP {problem.xp}</Badge>
              <Badge variant="outline" className="border-gray-300 text-gray-700">{problem.difficulty}</Badge>
              {problem.tags && problem.tags.length > 0 && problem.tags.map((t: string, idx: number) => (
                <Badge key={`${problem.id}-tag-${idx}`} variant="secondary" className="bg-gray-100 text-gray-700">{t}</Badge>
              ))}
            </div>
            <Separator className="my-4"/>
            <div className="prose prose-sm max-w-none mb-6">
              <p className="text-gray-800 leading-relaxed break-words whitespace-pre-wrap">
                <strong className="text-gray-800">Problem:</strong> {problem.content || "No problem content available."}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="bg-gray-100 flex-shrink-0">
            <TabsTrigger value="write" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Write Solution</TabsTrigger>
            <TabsTrigger value="auto" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Auto-check</TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="flex-1 mt-3 overflow-hidden">
            <div className="h-full rounded-xl border-2 border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
              <div className="flex-1 grid gap-4 md:grid-cols-2">
                <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Editor
                  </div>
                  <textarea
                    className="flex-1 min-h-[260px] w-full resize-none bg-white p-4 text-[13px] leading-6 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/70"
                    placeholder="Type your proof with Markdown/LaTeX…"
                    value={solutionDraft}
                    onChange={(event) => setSolutionDraft(event.target.value)}
                  ></textarea>
                </div>
                <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    <span>Preview</span>
                    <span className="text-[11px] font-normal text-gray-400">{previewHeaderStatus}</span>
                  </div>
                  <div className="flex-1 overflow-auto bg-white p-4 text-[13px] leading-6 text-gray-800 min-h-[260px]">
                    {previewStatus === "loading" && (
                      <div className="text-xs text-gray-500">Rendering preview…</div>
                    )}
                    {previewStatus === "error" && previewError && (
                      <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                        {previewError}
                      </div>
                    )}
                    {previewStatus === "ready" && (
                      <>
                        {previewSource !== solutionDraft && (
                          <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            Preview is out of date — click Preview again to refresh.
                          </div>
                        )}
                        {previewHtml ? (
                          <MathPreview html={previewHtml} className="min-h-[220px]" />
                        ) : (
                          <div className="text-xs text-gray-500">Preview is empty.</div>
                        )}
                      </>
                    )}
                    {previewStatus === "idle" && !previewVisible && (
                      <div className="text-xs text-gray-500">Click Preview to render your work.</div>
                    )}
                    {previewStatus === "idle" && previewVisible && (
                      <div className="text-xs text-gray-500">Preview ready.</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Submit Solution</Button>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700"
                  onClick={handlePreviewClick}
                  disabled={previewStatus === "loading"}
                >
                  {previewStatus === "loading" ? "Rendering…" : "Preview"}
                </Button>
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
            <div className="mb-3 text-sm font-semibold text-gray-800">Discussion</div>
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
        </div>
      </ScrollArea>
    </DialogContent>
  );
}

function SkillTreeCanvas({ onOpenNode }: { onOpenNode?: (id: string) => void }) {
  const { selectedNode, setSelectedNode } = useLearningSync();
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>([]);
  const [skillEdges, setSkillEdges] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [problems, setProblems] = useState<ProblemDisplay[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Fetch learning path data from Supabase
  useEffect(() => {
    const fetchLearningPath = async () => {
      try {
        setIsLoading(true);
        // Fetch all problems
        const supabaseProblems = await problemsAPI.getAll();
        const convertedProblems = supabaseProblems.map(convertSupabaseProblem);
        setProblems(convertedProblems);

        // Fetch all relationships efficiently
        const allRelationships: any[] = [];
        const batchSize = 10;
        for (let i = 0; i < supabaseProblems.length; i += batchSize) {
          const batch = supabaseProblems.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (problem) => {
              try {
                const relationships = await problemRelationshipsAPI.getLearningPath(problem.id);
                allRelationships.push(...relationships);
              } catch (err) {
                // Skip if error
              }
            })
          );
        }

        // Build learning paths horizontally
        const { nodes, edges } = buildLearningPaths(supabaseProblems, allRelationships);
        setSkillNodes(nodes);
        setSkillEdges(edges);
      } catch (err) {
        console.error('Failed to fetch learning path:', err);
        // Fallback to empty
        setSkillNodes([]);
        setSkillEdges([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLearningPath();
  }, []);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.3));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan/drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.max(0.3, Math.min(3, zoom + delta));
    setZoom(newZoom);
  };

  // quick lookup for positions
  const positions = React.useMemo(() => Object.fromEntries(skillNodes.map(n => [n.id, n])), [skillNodes]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
    if (onOpenNode) onOpenNode(nodeId);
  };

  const selectedNodeData = selectedNode ? skillNodes.find(n => n.id === selectedNode) : null;

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-base">Learning Path</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[420px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (skillNodes.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-base">Learning Path</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[420px]">
          <div className="text-center text-gray-500 text-sm">
            No learning path data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate canvas dimensions
  const maxX = skillNodes.length > 0 ? Math.max(...skillNodes.map(n => n.x), 100) + 300 : 800;
  const maxY = skillNodes.length > 0 ? Math.max(...skillNodes.map(n => n.y), 100) + 200 : 600;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-base">Learning Path</CardTitle>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600 text-white">Progressive</Badge>
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">Interactive</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomReset}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            title="Reset View"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <div className="text-xs text-center text-gray-500 px-2 py-1 border-t border-gray-200">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Canvas Container */}
        <div
          ref={containerRef}
          className="relative h-[560px] w-full overflow-hidden bg-gray-50"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div
            className="absolute"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: `${maxX}px`,
              height: `${maxY}px`,
            }}
          >
            {/* Edges */}
            <svg className="absolute inset-0 w-full h-full" style={{ width: maxX, height: maxY }}>
              {skillEdges.map(([a, b], idx) => {
                const A = positions[a];
                const B = positions[b];
                if (!A || !B) return null;
                return (
                  <line
                    key={idx}
                    x1={A.x}
                    y1={A.y}
                    x2={B.x}
                    y2={B.y}
                    stroke="#94a3b8"
                    strokeWidth={2 / zoom}
                    markerEnd="url(#arrow)"
                    opacity={0.6}
                  />
                );
              })}
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                </marker>
              </defs>
            </svg>

            {/* Nodes */}
            {skillNodes.map((n) => (
              <button
                key={n.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeClick(n.id);
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border px-3 py-2 bg-white shadow-sm transition-all border-gray-200 hover:shadow-md ${
                  n.unlocked ? "hover:bg-gray-50" : "bg-gray-100 opacity-60"
                } ${selectedNode === n.id ? "ring-2 ring-blue-600 border-blue-600 shadow-md" : ""}`}
                style={{
                  left: n.x,
                  top: n.y,
                  minWidth: '140px',
                  maxWidth: '180px',
                }}
              >
                <div className="flex items-center gap-2 text-sm">
                  {n.unlocked ? (
                    <Unlock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="font-medium text-gray-800 truncate">{n.label}</span>
                </div>
                <div className="mt-1 text-[10px] text-gray-500">
                  {n.level} • Age {n.age}
                </div>
              </button>
            ))}
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
            💡 Drag to pan • Scroll to zoom • Click nodes to view details
          </div>
        </div>
        
        {/* Selected Node Problems */}
        {selectedNodeData && selectedNodeData.problems.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <h4 className="font-semibold text-sm text-gray-800 mb-2">{selectedNodeData.label}</h4>
            <p className="text-xs text-gray-500 mb-3">{selectedNodeData.description}</p>
            <div className="grid gap-4">
              {selectedNodeData.problems.map(problemId => {
                const problem = problems.find(p => p.id === problemId);
                if (!problem) return null;
                
                return (
                  <div key={problemId} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{problem.title}</div>
                      <div className="text-xs text-gray-500">
                        XP {problem.xp} • {problem.difficulty} • Age {problem.age}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        // Store the problem ID in sessionStorage to open it on Problems page
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('selectedProblemId', problem.id);
                          // Trigger navigation via custom event that parent listens to
                          const event = new CustomEvent('navigate-to-page', { 
                            detail: { page: 'problems', problemId: problem.id } 
                          });
                          window.dispatchEvent(event);
                        }
                      }}
                    >
                      Solve
                    </Button>
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
            <Link href="/admin/problems">
              <Button size="sm" variant="ghost" className="gap-1 text-gray-600 hover:text-gray-800">
                <Lock className="h-4 w-4"/>Admin
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}