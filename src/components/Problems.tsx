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
import MathPreview from "@/components/MathPreview";
import { magicSquareProblems } from "@/lib/magicSquareProblems";

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
    <DialogContent className="flex h-[90vh] w-[95vw] max-w-7xl flex-col overflow-hidden border-2 border-gray-200 bg-white text-sm shadow-2xl">
      <div className="flex h-full flex-col overflow-hidden">
        {/* Problem Header with metadata */}
        <div className="flex-shrink-0">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              {problem.title}
              {problem.unlocked ? <Unlock className="h-5 w-5 text-emerald-600" /> : <Lock className="h-5 w-5 text-red-500" />}
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600 mb-3">Topic: Number Theory → Modular Arithmetic</div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <Badge className="bg-blue-100 text-blue-800">XP {problem.xp}</Badge>
            <Badge variant="outline" className="border-gray-300 text-gray-700">{problem.difficulty}</Badge>
            {problem.tags.map((t: string) => (
              <Badge key={t} variant="secondary" className="bg-gray-100 text-gray-700">
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <Separator className="my-4 flex-shrink-0" />

        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-6 pb-8 pr-1">
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-800 leading-relaxed break-words whitespace-pre-line">
                <strong className="text-gray-900">Problem:</strong>{" "}
                {problem.content || "Find all integers x such that x ≡ 7 (mod 13) and 5x ≡ 2 (mod 11)."}
              </div>
              {problem.hint && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <strong className="text-blue-900">Hint:</strong> <span className="ml-2">{problem.hint}</span>
                </div>
              )}
            </div>

            <Tabs value={tab} onValueChange={(value) => setTab(value as "write" | "auto")} className="space-y-3">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="write" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                  Write Solution
                </TabsTrigger>
                <TabsTrigger value="auto" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                  Auto-check
                </TabsTrigger>
              </TabsList>

              {/* Written Solution Tab */}
              <TabsContent value="write">
                <div className="space-y-4 rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Editor
                      </div>
                      <textarea
                        className="min-h-[260px] w-full flex-1 resize-none bg-white p-4 text-xs leading-6 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/70"
                        placeholder="Type your proof with Markdown/LaTeX…"
                        value={solutionDraft}
                        onChange={(event) => setSolutionDraft(event.target.value)}
                      ></textarea>
                    </div>
                    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <span>Preview</span>
                        <span className="text-xs font-normal text-gray-400">{previewHeaderStatus}</span>
                      </div>
                      <div className="min-h-[220px] flex-1 overflow-auto bg-white p-4 text-xs leading-6 text-gray-800">
                        {previewStatus === "loading" && <div className="text-xs text-gray-500">Rendering preview…</div>}
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
                              <MathPreview html={previewHtml} className="min-h-[200px]" />
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
                    <Button variant="ghost" className="gap-1 text-gray-600 hover:text-gray-800">
                      <BookOpen className="h-4 w-4" /> Review Theory
                    </Button>
                    <Button variant="ghost" className="gap-1 text-gray-600 hover:text-gray-800">
                      <Star className="h-4 w-4" /> Hint (−10 XP)
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Auto-check Tab */}
              <TabsContent value="auto">
                <div className="rounded-xl border-2 border-gray-200 p-4 space-y-3 bg-gray-50">
                  <div className="text-sm text-gray-700">Enter a numeric answer (if applicable):</div>
                  <Input placeholder="e.g., 42" className="bg-white border-gray-300" />
                  <div className="flex items-center gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">Check</Button>
                    <span className="text-xs text-gray-500">Auto-grading supports MCQ/short answer</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />

            <div>
              <div className="mb-3 text-sm font-semibold text-gray-900">Discussion</div>
              <div className="rounded-xl border-2 border-gray-200 p-4 space-y-3 max-h-32 overflow-auto bg-gray-50">
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
                  <Input placeholder="Write a comment…" className="bg-white border-gray-300" />
                  <Button className="gap-1 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                    <Send className="h-4 w-4" />
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
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
