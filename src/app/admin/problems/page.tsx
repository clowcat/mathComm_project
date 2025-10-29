"use client";

import React, { useState, useRef } from "react";
import MathPreview from "@/components/MathPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Problem {
  id: string;
  title: string;
  content: string;
  solution: string;
  difficulty: number;
  category: string;
  imageUrl?: string;
  linkedProblems: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function ProblemManagementPage() {
  const [problems, setProblems] = useState<Problem[]>([
    {
      id: "1",
      title: "Sample Problem 1",
      content: "Solve \\( x^2 + 5x + 6 = 0 \\)",
      solution: "x = -2, x = -3",
      difficulty: 3,
      category: "Algebra",
      linkedProblems: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form states
  const [problemTitle, setProblemTitle] = useState("");
  const [problemContent, setProblemContent] = useState("");
  const [solution, setSolution] = useState("");
  const [difficulty, setDifficulty] = useState(5);
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkedProblems, setLinkedProblems] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setIsEditing(true);
    setProblemTitle(problem.title);
    setProblemContent(problem.content);
    setSolution(problem.solution);
    setDifficulty(problem.difficulty);
    setCategory(problem.category);
    setImageUrl(problem.imageUrl || "");
    setLinkedProblems(problem.linkedProblems);
  };

  const handleNewProblem = () => {
    setSelectedProblem(null);
    setIsEditing(false);
    setProblemTitle("");
    setProblemContent("");
    setSolution("");
    setDifficulty(5);
    setCategory("");
    setImageUrl("");
    setLinkedProblems([]);
  };

  const handleSaveProblem = () => {
    if (!problemTitle || !problemContent) {
      alert("Please fill in all required fields");
      return;
    }

    if (selectedProblem && isEditing) {
      // Update existing problem
      setProblems(problems.map(p => 
        p.id === selectedProblem.id 
          ? {
              ...p,
              title: problemTitle,
              content: problemContent,
              solution,
              difficulty,
              category,
              imageUrl,
              linkedProblems,
              updatedAt: new Date(),
            }
          : p
      ));
    } else {
      // Create new problem
      const newProblem: Problem = {
        id: Date.now().toString(),
        title: problemTitle,
        content: problemContent,
        solution,
        difficulty,
        category,
        imageUrl,
        linkedProblems,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProblems([...problems, newProblem]);
    }

    handleNewProblem();
  };

  const handleDeleteProblem = (id: string) => {
    if (confirm("Are you sure you want to delete this problem?")) {
      setProblems(problems.filter(p => p.id !== id));
      if (selectedProblem?.id === id) {
        handleNewProblem();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real implementation, upload to storage and get URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIDifficulty = async () => {
    // Placeholder for AI-based difficulty calculation
    alert("AI difficulty calculation will be implemented with backend integration");
    // In real implementation: call AI API to analyze problem and set difficulty
    setDifficulty(Math.floor(Math.random() * 10) + 1);
  };

  const filteredProblems = problems.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (diff: number) => {
    if (diff <= 3) return "bg-green-100 text-green-800 border-green-200";
    if (diff <= 6) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <div className="container mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-800">Problem Content Management</h1>
          <p className="text-sm text-gray-500">Create, edit, and manage math problems</p>
        </header>
        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Problem List Section (Left) */}
          <div className="md:col-span-1">
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-800">Problem List</CardTitle>
                  <Button 
                    onClick={handleNewProblem}
                    className="bg-blue-600 text-white font-medium py-1 px-3 rounded-md hover:bg-blue-700"
                  >
                    New
                  </Button>
                </div>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search problems..."
                  className="mt-2 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2 p-4">
                    {filteredProblems.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p className="text-sm">No problems found</p>
                      </div>
                    ) : (
                      filteredProblems.map((problem) => (
                        <div
                          key={problem.id}
                          className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                            selectedProblem?.id === problem.id
                              ? "bg-gray-100 border-blue-600"
                              : "bg-white border-gray-200"
                          }`}
                          onClick={() => handleSelectProblem(problem)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-800">{problem.title}</h3>
                              <p className="text-xs text-gray-500 mt-1">{problem.category}</p>
                            </div>
                            <Badge className={`text-xs ${getDifficultyColor(problem.difficulty)} border`}>
                              D{problem.difficulty}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {problem.updatedAt.toLocaleDateString()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProblem(problem.id);
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Problem Editor Section (Right) */}
          <div className="md:col-span-2">
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="p-6">
                <CardTitle className="text-xl font-semibold text-gray-800">
                  {isEditing ? "Edit Problem" : "New Problem"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor="problemTitle" className="text-sm font-medium text-gray-800">
                    Problem Title *
                  </label>
                  <Input
                    id="problemTitle"
                    value={problemTitle}
                    onChange={(e) => setProblemTitle(e.target.value)}
                    placeholder="Enter the problem title"
                    className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="text-sm font-medium text-gray-800">
                      Category
                    </label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Algebra, Geometry"
                      className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="difficulty" className="text-sm font-medium text-gray-800">
                      Difficulty (1-10)
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="difficulty"
                        type="number"
                        min="1"
                        max="10"
                        value={difficulty}
                        onChange={(e) => setDifficulty(parseInt(e.target.value) || 1)}
                        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <Button
                        onClick={handleAIDifficulty}
                        variant="outline"
                        className="text-xs text-gray-700 border-gray-300 hover:bg-gray-50"
                      >
                        AI Set
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Problem Content */}
                <div>
                  <label htmlFor="problemContent" className="text-sm font-medium text-gray-800">
                    Problem Content (KaTeX/MathJax) *
                  </label>
                  <textarea
                    id="problemContent"
                    value={problemContent}
                    onChange={(e) => setProblemContent(e.target.value)}
                    placeholder="Enter the problem content using KaTeX/MathJax syntax. e.g., \( E = mc^2 \) or \[ \int_0^1 x^2 dx \]"
                    className="w-full h-32 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mt-1 text-sm"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium text-gray-800">
                    Problem Image (Optional)
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="text-sm text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      Upload Image/PDF
                    </Button>
                    {imageUrl && (
                      <span className="text-xs text-green-600">Image uploaded</span>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <h3 className="text-sm font-medium text-gray-800">Preview</h3>
                  <div className="p-4 border border-gray-200 rounded-md mt-1 bg-gray-50 min-h-[120px]">
                    {imageUrl && (
                      <img 
                        src={imageUrl} 
                        alt="Problem" 
                        className="max-w-full h-auto mb-4 rounded-md" 
                      />
                    )}
                    <MathPreview html={problemContent} />
                  </div>
                </div>

                {/* Solution */}
                <div>
                  <label htmlFor="solution" className="text-sm font-medium text-gray-800">
                    Solution
                  </label>
                  <textarea
                    id="solution"
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Enter the solution (supports KaTeX/MathJax)"
                    className="w-full h-24 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mt-1 text-sm"
                  />
                </div>

                {/* Linked Problems */}
                <div>
                  <label htmlFor="linkedProblems" className="text-sm font-medium text-gray-800">
                    Linked Problems (IDs, comma-separated)
                  </label>
                  <Input
                    id="linkedProblems"
                    value={linkedProblems.join(", ")}
                    onChange={(e) => setLinkedProblems(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    placeholder="e.g., 1, 2, 3"
                    className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Link problems sequentially from lower to higher difficulty
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    onClick={handleNewProblem}
                    variant="outline"
                    className="text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProblem}
                    className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    {isEditing ? "Update Problem" : "Save Problem"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
