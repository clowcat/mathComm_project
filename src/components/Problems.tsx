// Problems Component - Browse and solve mathematical problems
// Features problem filtering, detailed problem view, and solution submission

"use client"
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Send, Lock, Unlock, Star, Filter, Loader2 } from "lucide-react";
import MathPreview from "@/components/MathPreview";
import { problemsAPI, getDifficultyLabel, type Problem as SupabaseProblem } from "@/lib/supabase";

// Progressive Magic Square Problems for Teaching (data imported from shared module)
/**
 * ProblemDialog Component - Modal for solving individual math problems
 * Features two solution modes: written proof and auto-check
 * @param problem - Problem object with metadata and unlock status
 */
function ProblemDialog({ problem }: { problem: any }) {
  // State to track active solution mode (write or auto-check)
  const [tab, setTab] = React.useState<"write" | "auto">("write");
  const [solutionDraft, setSolutionDraft] = React.useState("");
  const [previewVisible, setPreviewVisible] = React.useState(false);
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "loading" | "ready" | "error">("idle");
  const [previewHtml, setPreviewHtml] = React.useState("");
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [previewSource, setPreviewSource] = React.useState("");
  
  // State for problem content rendering (LaTeX)
  const [problemHtml, setProblemHtml] = React.useState<string>("");
  const [problemContentLoading, setProblemContentLoading] = React.useState(true);

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

  // Load and render problem content as LaTeX when component mounts
  React.useEffect(() => {
    const loadProblemContent = async () => {
      if (!problem?.content) {
        setProblemHtml("");
        setProblemContentLoading(false);
        return;
      }

      try {
        setProblemContentLoading(true);
        const response = await fetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: problem.content }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error((payload as { error?: string }).error || "Failed to render problem content.");
        }

        const html = typeof (payload as { html?: unknown }).html === "string" ? (payload as { html: string }).html : "";
        setProblemHtml(html || problem.content);
      } catch (error) {
        console.error("Failed to render problem content:", error);
        // Fallback to plain text if rendering fails
        setProblemHtml(problem.content);
      } finally {
        setProblemContentLoading(false);
      }
    };

    loadProblemContent();
  }, [problem?.content]);
  
  return (
    <DialogContent className="flex w-[95vw] max-w-7xl max-h-[90vh] flex-col overflow-y-auto p-6 bg-white border-2 border-gray-200 text-sm text-gray-800 shadow-2xl">
      <DialogHeader className="space-y-2">
        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
          {problem.title}
          {problem.unlocked ? <Unlock className="h-5 w-5 text-blue-600" /> : <Lock className="h-5 w-5 text-red-500" />}
        </DialogTitle>
      </DialogHeader>
      {problem.category_path && (
        <div className="text-sm text-gray-500">Topic: {problem.category_path}</div>
      )}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge className="bg-blue-600 text-white">XP {problem.xp}</Badge>
        <Badge variant="outline" className="border-gray-300 text-gray-700">
          {problem.difficulty}
        </Badge>
        {problem.tags && problem.tags.length > 0 && problem.tags.map((tag: string, idx: number) => (
          <Badge key={`${problem.id}-tag-${idx}`} variant="secondary" className="bg-gray-100 text-gray-700">
            {tag}
          </Badge>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="text-gray-800 leading-relaxed">
            <strong className="text-gray-800">Problem:</strong>{" "}
            {problemContentLoading ? (
              <div className="mt-2 text-sm text-gray-500">Loading problem content...</div>
            ) : problemHtml ? (
              <div className="mt-2">
                <MathPreview html={problemHtml} className="text-gray-800" />
              </div>
            ) : (
              <div className="mt-2 text-gray-600">No problem content available.</div>
            )}
          </div>
          {problem.hint && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800">
              <strong className="text-blue-900">Hint:</strong> <span className="ml-2">{problem.hint}</span>
            </div>
          )}
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as "write" | "auto")} className="space-y-4">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="write" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
              Write Solution
            </TabsTrigger>
            <TabsTrigger value="auto" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
              Auto-check
            </TabsTrigger>
          </TabsList>

          <TabsContent value="write">
            <div className="space-y-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Editor
                  </div>
                  <textarea
                    className="flex-1 min-h-64 w-full resize-none p-4 bg-white text-xs leading-6 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/70"
                    placeholder="Type your proof with Markdown/LaTeX…"
                    value={solutionDraft}
                    onChange={(event) => setSolutionDraft(event.target.value)}
                  ></textarea>
                </div>
                <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span>Preview</span>
                    <span className="text-xs font-normal text-gray-400">{previewHeaderStatus}</span>
                  </div>
                  <div className="flex-1 min-h-52 overflow-y-auto p-4 bg-white text-xs leading-6 text-gray-800">
                    {previewStatus === "loading" && <div className="text-xs text-gray-500">Rendering preview…</div>}
                    {previewStatus === "error" && previewError && (
                      <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{previewError}</div>
                    )}
                    {previewStatus === "ready" && (
                      <>
                        {previewSource !== solutionDraft && (
                          <div className="mb-3 px-3 py-2 bg-amber-50 rounded border border-amber-200 text-xs text-amber-700">
                            Preview is out of date — click Preview again to refresh.
                          </div>
                        )}
                        {previewHtml ? (
                          <MathPreview html={previewHtml} className="min-h-52" />
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
              <div className="flex flex-wrap items-center gap-3">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">Submit Solution</Button>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700"
                  onClick={handlePreviewClick}
                  disabled={previewStatus === "loading"}
                >
                  {previewStatus === "loading" ? "Rendering…" : "Preview"}
                </Button>
                <Button variant="ghost" className="gap-1 text-gray-600 hover:text-gray-800">
                  <BookOpen className="h-4 w-4" /> Review Theory
                </Button>
                <Button variant="ghost" className="gap-1 text-gray-600 hover:text-gray-800">
                  <Star className="h-4 w-4" /> Hint (−10 XP)
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="auto">
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div className="text-sm text-gray-700">Enter a numeric answer (if applicable):</div>
              <Input placeholder="e.g., 42" className="border border-gray-300 bg-white" />
              <div className="flex items-center gap-2">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">Check</Button>
                <span className="text-xs text-gray-500">Auto-grading supports MCQ/short answer</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-900">Discussion</div>
          <div className="max-h-32 space-y-3 overflow-y-auto p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
            <div className="text-sm text-gray-800">
              <strong className="text-blue-600">Ada:</strong> Try reducing both congruences to a single modulus via CRT.
            </div>
            <div className="text-sm text-gray-800">
              <strong className="text-green-600">M. Seo:</strong> Solved using inverses mod 11 and mod 13, then combined.
            </div>
            <div className="text-sm text-gray-800">
              <strong className="text-purple-600">Carl:</strong> A hint: inverse of 5 mod 11 is 9.
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Input placeholder="Write a comment…" className="border border-gray-300 bg-white" />
              <Button className="gap-1 bg-blue-600 text-white hover:bg-blue-700" size="sm">
                <Send className="h-4 w-4" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

// Convert Supabase Problem to component format
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

// Convert Supabase Problem to display format
function convertSupabaseProblem(sp: SupabaseProblem): ProblemDisplay {
  // All problems should be unlocked regardless of hierarchy position
  // (parent_problem_id, children, etc.)
  return {
    id: sp.id,
    title: sp.title,
    level: sp.level || getDifficultyLabel(sp.difficulty),
    age: sp.age_range || "All Ages",
    xp: sp.xp || sp.difficulty * 50,
    difficulty: getDifficultyLabel(sp.difficulty),
    tags: sp.tags || (sp.category_path ? sp.category_path.split(' > ') : []),
    unlocked: true, // All problems unlocked - no hierarchy restrictions
    content: sp.content,
    hint: undefined, // Can be added from concepts or other fields
    solution: sp.solution,
    category_path: sp.category_path,
  };
}

/**
 * Main Problems Component
 * Displays a scrollable list of problems with filtering options
 * Each problem can be opened in a detailed dialog for solving
 * Fetches problems from Supabase database
 */
export default function Problems() {
  // State for problems and loading
  const [problems, setProblems] = useState<ProblemDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filtering
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedAge, setSelectedAge] = useState("All");
  
  // State for auto-opening problem dialog when navigating from Dashboard
  const [autoOpenProblemId, setAutoOpenProblemId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch problems from Supabase on mount
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const supabaseProblems = await problemsAPI.getAll();
        // Convert all problems and ensure all are unlocked regardless of hierarchy
        const convertedProblems = supabaseProblems.map((sp) => {
          const converted = convertSupabaseProblem(sp);
          // Force unlock status to true for all problems (no hierarchy restrictions)
          converted.unlocked = true;
          return converted;
        });
        setProblems(convertedProblems);
      } catch (err: any) {
        console.error('Failed to fetch problems from Supabase:', err);
        setError(err.message || 'Failed to load problems. Please check your connection.');
        // Fallback to empty array on error
        setProblems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblems();
  }, []);
  
  // Check for selectedProblemId in sessionStorage when component mounts or problems are loaded
  // and auto-open the dialog for that problem
  useEffect(() => {
    if (!isLoading && problems.length > 0 && typeof window !== 'undefined') {
      const selectedProblemId = sessionStorage.getItem('selectedProblemId');
      if (selectedProblemId) {
        // Check if the problem exists in the loaded problems
        const problemExists = problems.some(p => p.id === selectedProblemId);
        if (problemExists) {
          setAutoOpenProblemId(selectedProblemId);
          setIsDialogOpen(true);
          // Scroll to the problem element after a short delay to ensure it's rendered
          setTimeout(() => {
            const problemElement = document.querySelector(`[data-problem-id="${selectedProblemId}"]`);
            if (problemElement) {
              problemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Find the Open button for this problem and click it to open the dialog
              const openButton = problemElement.querySelector('button');
              if (openButton) {
                setTimeout(() => {
                  openButton.click();
                }, 200);
              }
            }
          }, 100);
          // Clear the sessionStorage after using it
          sessionStorage.removeItem('selectedProblemId');
        } else {
          // Problem not found, clear it anyway
          sessionStorage.removeItem('selectedProblemId');
        }
      }
    }
  }, [isLoading, problems]);
  
  // Filter problems based on selected criteria
  const filteredProblems = problems.filter(problem => {
    const levelMatch = selectedLevel === "All" || problem.level === selectedLevel;
    const ageMatch = selectedAge === "All" || problem.age === selectedAge;
    return levelMatch && ageMatch;
  });
  
  // Get unique levels and ages for filter options
  const levels = ["All", ...new Set(problems.map(p => p.level).filter(Boolean))];
  const ages = ["All", ...new Set(problems.map(p => p.age).filter(Boolean))];
  
  return (
    <div className="p-4 space-y-4 bg-white text-gray-800">
      {/* Header with filtering options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-gray-800">Math Problems</div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Filter by:</span>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4">
              {/* Level Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">Level:</span>
                <div className="flex gap-1">
                  {levels.map(level => (
                    <Button
                      key={level}
                      size="sm"
                      variant={selectedLevel === level ? "default" : "outline"}
                      onClick={() => setSelectedLevel(level)}
                      className={`text-xs ${
                        selectedLevel === level 
                          ? "bg-blue-600 text-white hover:bg-blue-700" 
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Age Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">Age:</span>
                <div className="flex gap-1">
                  {ages.map(age => (
                    <Button
                      key={age}
                      size="sm"
                      variant={selectedAge === age ? "default" : "outline"}
                      onClick={() => setSelectedAge(age)}
                      className={`text-xs ${
                        selectedAge === age 
                          ? "bg-blue-600 text-white hover:bg-blue-700" 
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {age}
                    </Button>
                  ))}
                </div>
              </div>
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-[560px] rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="text-sm font-medium">Loading problems...</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="text-sm font-semibold text-red-800 mb-2">Error Loading Problems</div>
          <div className="text-xs text-red-600">{error}</div>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white hover:bg-red-700"
            size="sm"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Scrollable problem list */}
      {!isLoading && !error && (
        <ScrollArea className="h-[560px] rounded-xl border border-gray-200 p-4 bg-white">
          <div className="grid gap-3">
            {filteredProblems.map((problem) => {
              const isOlympiad = problem.level === "Olympiad";
              const isBeginner = problem.level === "Beginner";
              
              return (
                <div 
                  key={problem.id}
                  data-problem-id={problem.id}
                  className={`rounded-lg border p-3 flex items-center justify-between bg-white border-gray-200 shadow-sm ${
                    isOlympiad ? 'border-yellow-300 bg-yellow-50' :
                    isBeginner ? 'border-green-300 bg-green-50' :
                    ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{problem.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Level: {problem.level} • Age: {problem.age} • XP: {problem.xp} • Difficulty: {problem.difficulty}
                    </div>
                    {problem.category_path && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        Category: {problem.category_path}
                      </div>
                    )}
                    {problem.tags && problem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {problem.tags.map((tag, idx) => (
                          <Badge key={`${problem.id}-${tag}-${idx}`} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-100"
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
            {filteredProblems.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                No problems match the selected filters. Try adjusting your selection.
              </div>
            )}

            {/* Show message if no problems at all */}
            {problems.length === 0 && !isLoading && !error && (
              <div className="text-center py-8 text-gray-500">
                No problems available. Check back later or contact support.
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
