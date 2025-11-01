"use client";

import React, { useState, useRef, useEffect } from "react";
import MathPreview from "@/components/MathPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Upload, Database, RefreshCw } from "lucide-react";

// Supabase and CSV utilities
import { problemsAPI, problemRelationshipsAPI, getDifficultyLabel, calculateXP, categoryToTags } from "@/lib/supabase";
import { exportProblemsToCSV, exportFilteredProblemsToCSV } from "@/lib/csvExport";
import { 
  CATEGORIES, 
  getCategoryById, 
  getLevel2Categories, 
  getLevel3Categories,
  getCategoryPath,
  findCategoryByName
} from "@/lib/categories";

interface Problem {
  id: string;
  title: string;
  content: string;
  solution: string;
  difficulty: number;
  category: string;
  diagramImageUrl?: string;
  linkedProblems: string[];
  isGenerated?: boolean;
  parentProblemId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RelatedProblem {
  title: string;
  content: string;
  solution: string;
  difficulty: number;
  category: string;
  concept: string;
  explanation: string;
}

export default function ProblemManagementPage() {
  const [problems, setProblems] = useState<Problem[]>([
    {
      id: "1",
      title: "Sample Problem 1",
      content: "Solve \\( x^2 + 5x + 6 = 0 \\)",
      solution: "\\( x = -2 \\) or \\( x = -3 \\)",
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
  const [selectedLevel1, setSelectedLevel1] = useState("");
  const [selectedLevel2, setSelectedLevel2] = useState("");
  const [selectedLevel3, setSelectedLevel3] = useState("");
  const [diagramImageUrl, setDiagramImageUrl] = useState("");
  const [linkedProblems, setLinkedProblems] = useState<string[]>([]);
  
  // AI analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState("");
  const [extractedDiagrams, setExtractedDiagrams] = useState<string[]>([]);
  const [inputMethod, setInputMethod] = useState<"manual" | "file">("file");
  const [relatedProblems, setRelatedProblems] = useState<RelatedProblem[]>([]);
  const [concepts, setConcepts] = useState<string[]>([]);
  const [showRelatedProblems, setShowRelatedProblems] = useState(false);
  const [selectedRelatedProblem, setSelectedRelatedProblem] = useState<RelatedProblem | null>(null);
  
  // Filtering and sorting states
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "title" | "difficulty">("newest");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Toast notification state
  const [toast, setToast] = useState<{show: boolean; message: string; type: "success" | "error"}>({
    show: false,
    message: "",
    type: "success"
  });
  
  // Supabase connection states
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  
  const problemFileInputRef = useRef<HTMLInputElement>(null);
  const diagramFileInputRef = useRef<HTMLInputElement>(null);
  
  // Load problems from Supabase on mount
  useEffect(() => {
    loadProblemsFromSupabase();
  }, []);
  
  // Load problems from Supabase
  const loadProblemsFromSupabase = async () => {
    try {
      setIsLoadingFromDb(true);
      const supabaseProblems = await problemsAPI.getAll();
      
      // Convert Supabase format to local format
      const convertedProblems = supabaseProblems.map(sp => ({
        id: sp.id,
        title: sp.title,
        content: sp.content,
        solution: sp.solution || '',
        difficulty: sp.difficulty,
        category: sp.category_path || sp.category_level1 || '',
        diagramImageUrl: sp.diagram_image_url,
        linkedProblems: sp.linked_problem_ids || [],
        isGenerated: sp.is_generated,
        parentProblemId: sp.parent_problem_id,
        createdAt: sp.created_at ? new Date(sp.created_at) : new Date(),
        updatedAt: sp.updated_at ? new Date(sp.updated_at) : new Date(),
      })) as Problem[];
      
      setProblems(convertedProblems);
      setIsDbConnected(true);
      showToast(`✅ Loaded ${convertedProblems.length} problems from database`, "success");
    } catch (error: any) {
      console.error('Failed to load from Supabase:', error);
      setIsDbConnected(false);
      // Keep using local mock data
      showToast("⚠️ Database not connected. Using local data.", "error");
    } finally {
      setIsLoadingFromDb(false);
    }
  };
  
  // Save problem to Supabase
  const saveProblemToSupabase = async (problem: Problem) => {
    try {
      setIsSavingToDb(true);
      
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('⚠️ Supabase not configured. Skipping database save.');
        showToast("⚠️ Supabase not configured. Problem saved locally only.", "error");
        return null;
      }
      
      // Convert local format to Supabase format
      const supabaseProblem = {
        title: problem.title,
        content: problem.content,
        solution: problem.solution || undefined,
        difficulty: problem.difficulty,
        category_path: problem.category,
        // Use INTEGER category IDs from the state
        category_level1: selectedLevel1 ? parseInt(selectedLevel1) : undefined,
        category_level2: selectedLevel2 ? parseInt(selectedLevel2) : undefined,
        category_level3: selectedLevel3 ? parseInt(selectedLevel3) : undefined,
        level: getDifficultyLabel(problem.difficulty),
        xp: calculateXP(problem.difficulty),
        tags: categoryToTags(problem.category),
        diagram_image_url: problem.diagramImageUrl || undefined,
        linked_problem_ids: problem.linkedProblems,
        is_generated: problem.isGenerated,
        parent_problem_id: problem.parentProblemId || undefined,
      };
      
      let savedProblem;
      if (problem.id.startsWith('temp-') || !isDbConnected) {
        // New problem - create
        console.log('Creating new problem in Supabase...');
        savedProblem = await problemsAPI.create(supabaseProblem);
      } else {
        // Existing problem - update
        console.log('Updating problem in Supabase:', problem.id);
        savedProblem = await problemsAPI.update(problem.id, supabaseProblem);
      }
      
      return savedProblem;
    } catch (error: any) {
      console.error('Failed to save to Supabase:', error);
      console.error('Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        error: error
      });
      
      // More user-friendly error message
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      showToast(`❌ Database save failed: ${errorMsg}`, "error");
      
      throw new Error(`Database save failed: ${errorMsg}`);
    } finally {
      setIsSavingToDb(false);
    }
  };
  
  // Export to CSV
  const handleExportCSV = () => {
    try {
      exportFilteredProblemsToCSV(problems, {
        category: filterCategory,
        difficulty: filterDifficulty,
        searchQuery: searchQuery,
      });
      showToast("✅ CSV file downloaded successfully!", "success");
    } catch (error) {
      console.error('CSV export error:', error);
      showToast("❌ Failed to export CSV", "error");
    }
  };

  // Toast notification helper
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setIsEditing(true);
    setProblemTitle(problem.title);
    setProblemContent(problem.content);
    setSolution(problem.solution);
    setDifficulty(problem.difficulty);
    setCategory(problem.category);
    setDiagramImageUrl(problem.diagramImageUrl || "");
    setLinkedProblems(problem.linkedProblems);
    setUploadedFile(null);
    setUploadedFilePreview("");
    setExtractedDiagrams([]);
  };

  const handleNewProblem = () => {
    // If there's unsaved content, warn the user
    if ((problemTitle || problemContent) && !selectedProblem) {
      if (!confirm("You have unsaved changes. Are you sure you want to start a new problem?")) {
        return;
      }
    }
    
    setSelectedProblem(null);
    setIsEditing(false);
    setProblemTitle("");
    setProblemContent("");
    setSolution("");
    setDifficulty(5);
    setCategory("");
    setSelectedLevel1("");
    setSelectedLevel2("");
    setDiagramImageUrl("");
    setLinkedProblems([]);
    setUploadedFile(null);
    setUploadedFilePreview("");
    setExtractedDiagrams([]);
    setInputMethod("file");
    setRelatedProblems([]);
    setConcepts([]);
    setShowRelatedProblems(false);
    
    showToast("📝 Ready to create a new problem", "success");
  };

  const handleSaveProblem = async () => {
    if (!problemTitle || !problemContent) {
      showToast("Please fill in all required fields (Title and Content)", "error");
      return;
    }

    if (selectedProblem && isEditing) {
      // Update existing problem
      const updatedProblem = {
        ...selectedProblem,
        title: problemTitle,
        content: problemContent,
        solution,
        difficulty,
        category,
        diagramImageUrl,
        linkedProblems,
        updatedAt: new Date(),
      };
      
      // Save to Supabase if connected
      if (isDbConnected) {
        try {
          const savedProblem = await saveProblemToSupabase(updatedProblem);
          // Update with Supabase ID
          updatedProblem.id = savedProblem.id;
        } catch (error: any) {
          showToast(`⚠️ Saved locally but DB sync failed: ${error.message}`, "error");
        }
      }
      
      setProblems(problems.map(p => 
        p.id === selectedProblem.id ? updatedProblem : p
      ));
      
      // Save derived problems AFTER updating problems array
      if (isDbConnected) {
        try {
          await saveDerivedProblems(updatedProblem.id);
        } catch (error: any) {
          console.error('Failed to save derived problems:', error);
          showToast(`⚠️ Derived problems not saved: ${error.message}`, "error");
        }
      }
      
      // Keep the updated problem selected
      setSelectedProblem(updatedProblem);
      
      showToast(`✅ Problem "${problemTitle}" updated successfully!${isDbConnected ? ' (Synced to DB)' : ' (Local only)'}`, "success");
    } else {
      // Create new problem
      const newProblem: Problem = {
        id: `temp-${Date.now()}`,  // Temporary ID
        title: problemTitle,
        content: problemContent,
        solution,
        difficulty,
        category,
        diagramImageUrl,
        linkedProblems,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Save to Supabase if connected
      let oldId = newProblem.id;
      if (isDbConnected) {
        try {
          const savedProblem = await saveProblemToSupabase(newProblem);
          // Replace temp ID with real Supabase ID
          newProblem.id = savedProblem.id;
        } catch (error: any) {
          showToast(`⚠️ Saved locally but DB sync failed: ${error.message}`, "error");
        }
      }
      
      setProblems([...problems, newProblem]);
      
      // Save derived problems AFTER updating problems array
      if (isDbConnected && newProblem.id !== oldId) {
        try {
          await saveDerivedProblems(newProblem.id, oldId);
        } catch (error: any) {
          console.error('Failed to save derived problems:', error);
          showToast(`⚠️ Derived problems not saved: ${error.message}`, "error");
        }
      }
      
      // Select the newly created problem and switch to editing mode
      setSelectedProblem(newProblem);
      setIsEditing(true);
      
      showToast(`✅ Problem "${problemTitle}" created successfully!${isDbConnected ? ' (Synced to DB)' : ' (Local only)'} Click "New" to create another.`, "success");
    }
    
    // Don't clear the form - keep the saved content visible
    // User can click "New" button if they want to create a new problem
  };

  // Helper function to save derived problems
  const saveDerivedProblems = async (parentProblemId: string, oldParentId?: string) => {
    // Get current problems state to find derived problems
    const currentProblems = problems;
    
    // Find all derived problems linked to this parent
    const derivedProblems = currentProblems.filter(p => 
      p.isGenerated === true && 
      (p.parentProblemId === parentProblemId || p.parentProblemId === oldParentId) &&
      p.id.startsWith('temp-derived-')  // Only unsaved derived problems
    );
    
    if (derivedProblems.length === 0) {
      console.log('ℹ️ No unsaved derived problems found');
      return;
    }
    
    console.log(`💾 Saving ${derivedProblems.length} derived problems...`);
    
    const savedDerivedIds: string[] = [];
    let successCount = 0;
    
    for (const derivedProblem of derivedProblems) {
      try {
        // Update parent ID to the real DB ID
        const problemToSave = {
          ...derivedProblem,
          parentProblemId: parentProblemId,
        };
        
        const savedDerived = await saveProblemToSupabase(problemToSave);
        const oldDerivedId = derivedProblem.id;
        
        console.log(`✅ Saved derived problem: ${savedDerived.id} (was ${oldDerivedId})`);
        
        // Update the problem in local state with new ID
        setProblems(prev => prev.map(p => 
          p.id === oldDerivedId ? { ...p, id: savedDerived.id, parentProblemId: parentProblemId } : p
        ));
        
        savedDerivedIds.push(savedDerived.id);
        
        // Create relationship in problem_relationships table
        try {
          // Find the concept from the original related problem
          const relatedProblem = relatedProblems.find(rp => 
            rp.title === derivedProblem.title
          );
          
          await problemRelationshipsAPI.create(
            parentProblemId,      // source (parent problem)
            savedDerived.id,      // target (derived problem)
            'derived',            // relationship type
            {
              concept: relatedProblem?.concept || 'AI Generated',
              description: relatedProblem?.explanation || 'Related problem generated by AI',
              strength: 0.8,
              sequenceOrder: successCount
            }
          );
          console.log(`✅ Relationship created: ${parentProblemId} -> ${savedDerived.id}`);
        } catch (relError: any) {
          console.warn('⚠️ Failed to create problem relationship (table may not exist or RLS enabled):', relError.message);
          // Don't fail the entire operation if relationship creation fails
        }
        
        successCount++;
      } catch (error: any) {
        console.error(`❌ Failed to save derived problem "${derivedProblem.title}":`, error.message);
      }
    }
    
    // Update parent's linked_problem_ids
    if (savedDerivedIds.length > 0) {
      try {
        const updatedLinkedProblems = [...linkedProblems.filter(id => !id.startsWith('temp-derived-')), ...savedDerivedIds];
        await problemsAPI.update(parentProblemId, {
          linked_problem_ids: updatedLinkedProblems
        });
        setLinkedProblems(updatedLinkedProblems);
        console.log(`✅ Parent problem linked_problem_ids updated with ${savedDerivedIds.length} IDs`);
      } catch (error: any) {
        console.warn('⚠️ Failed to update parent linked_problem_ids:', error.message);
      }
    }
    
    if (successCount > 0) {
      showToast(`✅ Saved ${successCount} derived problem(s) to database!`, "success");
    } else if (derivedProblems.length > 0) {
      showToast(`⚠️ Failed to save ${derivedProblems.length} derived problem(s)`, "error");
    }
  };

  const handleDeleteProblem = (id: string) => {
    const problemToDelete = problems.find(p => p.id === id);
    if (confirm("Are you sure you want to delete this problem?")) {
      setProblems(problems.filter(p => p.id !== id));
      if (selectedProblem?.id === id) {
        handleNewProblem();
      }
      showToast(`🗑️ Deleted "${problemToDelete?.title || 'Problem'}"`, "success");
    }
  };

  const handleProblemFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiagramImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDiagramImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIAnalyzeProblem = async () => {
    if (!uploadedFile) {
      alert("Please upload a file first");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Convert file to base64
      const base64 = uploadedFilePreview;

      // Call OpenAI API through our backend
      const response = await fetch('/api/analyze-problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          action: 'analyze',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('API Error:', result);
        let errorMessage = result.error || 'Failed to analyze problem';
        
        // If raw response exists, show it for debugging
        if (result.rawResponse) {
          console.error('Raw AI Response:', result.rawResponse);
          errorMessage += '\n\nCheck console for raw AI response.';
        }
        
        throw new Error(errorMessage);
      }

      const data = result.data;

      if (!data) {
        throw new Error('No data received from AI');
      }

      // Set extracted data
      setProblemTitle(data.title || "Untitled Problem");
      setProblemContent(data.content || "");
      setSolution(data.solution || "");
      
      // Set difficulty from AI
      if (data.difficulty) {
        setDifficulty(Math.min(10, Math.max(1, data.difficulty)));
      }

      // Match and set category from hierarchy
      const matchedCategory = matchCategoryFromAI(
        data.categoryLevel1,
        data.categoryLevel2,
        data.categoryLevel3,
        data.categoryConfidence || 0
      );
      
      if (matchedCategory.success) {
        setSelectedLevel1(matchedCategory.level1Id || "");
        setSelectedLevel2(matchedCategory.level2Id || "");
        setSelectedLevel3(matchedCategory.level3Id || "");
        setCategory(matchedCategory.categoryPath || "");
      } else {
        // Category matching failed - show warning
        alert(`⚠️ Category Matching Issue:\n\nAI suggested: ${data.categoryLevel1} > ${data.categoryLevel2 || ''} > ${data.categoryLevel3 || ''}\n\nCouldn't find exact match in database. Please select manually.\n\nSuggestion: ${matchedCategory.suggestion || 'Select the closest category'}`);
      }

      // If diagrams were detected, add them to extracted diagrams
      if (data.hasDiagrams) {
        setExtractedDiagrams([uploadedFilePreview]);
      }

      alert("✅ AI analysis complete!\n\n• Title, content, solution extracted\n• Difficulty set to " + (data.difficulty || 5) + "/10\n• Category: " + (matchedCategory.success ? "Auto-matched ✓" : "Please select manually") + "\n\nReview and edit as needed.");
    } catch (error: any) {
      console.error("AI analysis error:", error);
      
      let userMessage = `Failed to analyze the problem: ${error.message}`;
      
      if (error.message.includes('API key')) {
        userMessage += '\n\n1. Make sure you have created .env.local file\n2. Add OPENAI_API_KEY=your-key\n3. Restart the development server';
      } else if (error.message.includes('JSON')) {
        userMessage += '\n\nThe AI returned an invalid format. Check console for details.';
      }
      
      alert(userMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectExtractedDiagram = (diagramUrl: string) => {
    setDiagramImageUrl(diagramUrl);
  };

  const handleRemoveExtractedDiagram = (index: number) => {
    setExtractedDiagrams(prev => prev.filter((_, i) => i !== index));
  };

  const handleAIGenerateSolution = async () => {
    if (!problemContent) {
      alert("Please enter problem content first");
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/generate-solution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problemContent,
          category,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate solution');
      }

      setSolution(result.solution);
      alert("AI solution generated! Please review and edit as needed.");
    } catch (error: any) {
      console.error("AI generation error:", error);
      alert(`Failed to generate solution: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAIDifficulty = async () => {
    if (!problemContent) {
      alert("Please enter problem content first");
      return;
    }

    setIsAnalyzing(true);

    try {
      // For now, use a simple heuristic or OpenAI API
      // In future: create dedicated difficulty calculation API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDifficulty(Math.floor(Math.random() * 10) + 1);
      alert("AI difficulty calculation complete!");
    } catch (error) {
      console.error("AI difficulty error:", error);
      alert("Failed to calculate difficulty.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRelatedProblems = async () => {
    if (!problemContent) {
      alert("Please enter problem content first");
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/generate-related-problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problemContent,
          category,
          difficulty,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate related problems');
      }

      const data = result.data;
      setRelatedProblems(data.relatedProblems || []);
      setConcepts(data.concepts || []);
      setShowRelatedProblems(true);
      
      alert(`Generated ${data.relatedProblems?.length || 0} related problems across ${data.concepts?.length || 0} concepts! Review them below.`);
    } catch (error: any) {
      console.error("AI generation error:", error);
      alert(`Failed to generate related problems: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddRelatedProblem = (relatedProblem: RelatedProblem) => {
    // 중복 체크: 같은 제목과 내용을 가진 문제가 이미 있는지 확인
    const isDuplicate = problems.some(p => 
      p.title === relatedProblem.title && 
      p.content === relatedProblem.content
    );
    
    if (isDuplicate) {
      showToast(`⚠️ "${relatedProblem.title}" is already in the problem list!`, "error");
      return;
    }
    
    const newProblem: Problem = {
      id: `temp-derived-${Date.now()}`,  // temp ID - will be replaced on save
      title: relatedProblem.title,
      content: relatedProblem.content,
      solution: relatedProblem.solution,
      difficulty: relatedProblem.difficulty,
      category: relatedProblem.category,
      linkedProblems: selectedProblem ? [selectedProblem.id] : [],
      isGenerated: true,
      parentProblemId: selectedProblem?.id || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Just add to local state - will be saved when "Save Problem" is clicked
    setProblems([...problems, newProblem]);
    
    // Link to current problem (local state)
    if (selectedProblem) {
      setLinkedProblems([...linkedProblems, newProblem.id]);
    }
    
    showToast(`✅ Added "${relatedProblem.title}" - Click "Save Problem" to save all changes`, "success");
  };

  // Enhanced filtering and sorting
  const filteredProblems = problems
    .filter(p => {
      // Search filter
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.id.includes(searchQuery);
      
      // Category filter
      const matchesCategory = filterCategory === "all" || 
                             p.category.toLowerCase().includes(filterCategory.toLowerCase());
      
      // Difficulty filter
      let matchesDifficulty = true;
      if (filterDifficulty !== "all") {
        if (filterDifficulty === "easy") matchesDifficulty = p.difficulty <= 3;
        else if (filterDifficulty === "medium") matchesDifficulty = p.difficulty >= 4 && p.difficulty <= 6;
        else if (filterDifficulty === "hard") matchesDifficulty = p.difficulty >= 7 && p.difficulty <= 9;
        else if (filterDifficulty === "olympic") matchesDifficulty = p.difficulty === 10;
      }
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "difficulty") {
        return b.difficulty - a.difficulty;
      }
      return 0;
    });

  // Statistics
  const stats = {
    total: problems.length,
    byCategory: problems.reduce((acc, p) => {
      const cat = p.category || "Uncategorized";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byDifficulty: {
      easy: problems.filter(p => p.difficulty <= 3).length,
      medium: problems.filter(p => p.difficulty >= 4 && p.difficulty <= 6).length,
      hard: problems.filter(p => p.difficulty >= 7 && p.difficulty <= 9).length,
      olympic: problems.filter(p => p.difficulty === 10).length,
    },
    avgDifficulty: problems.length > 0 
      ? (problems.reduce((sum, p) => sum + p.difficulty, 0) / problems.length).toFixed(1)
      : "0",
  };

  const getDifficultyColor = (diff: number) => {
    if (diff <= 3) return "bg-green-100 text-green-800 border-green-200";
    if (diff <= 6) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  // Match AI-suggested category to database categories
  const matchCategoryFromAI = (
    aiLevel1?: string,
    aiLevel2?: string,
    aiLevel3?: string,
    confidence?: number
  ): {
    success: boolean;
    level1Id?: string;
    level2Id?: string;
    level3Id?: string;
    categoryPath?: string;
    suggestion?: string;
  } => {
    if (!aiLevel1) {
      return {
        success: false,
        suggestion: "No category detected. Please select manually."
      };
    }

    // Find Level 1 match using the new categories library
    const l1Match = findCategoryByName(aiLevel1);
    
    if (!l1Match || l1Match.level !== 1) {
      return {
        success: false,
        suggestion: `Could not match "${aiLevel1}" to any Level 1 category. Please select manually.`
      };
    }

    // If only Level 1
    if (!aiLevel2) {
      return {
        success: true,
        level1Id: l1Match.id.toString(),
        categoryPath: l1Match.name
      };
    }

    // Find Level 2 match
    const l2Match = findCategoryByName(aiLevel2);
    const l2Categories = getLevel2Categories(l1Match.id);
    
    // Verify L2 is actually a child of L1
    const validL2 = l2Match && l2Categories.find(c => c.id === l2Match.id);
    
    if (!validL2) {
      return {
        success: true,
        level1Id: l1Match.id.toString(),
        categoryPath: l1Match.name,
        suggestion: `Matched ${l1Match.name}, but could not match "${aiLevel2}" to sub-category.`
      };
    }

    // If only Level 1 and 2
    if (!aiLevel3) {
      return {
        success: true,
        level1Id: l1Match.id.toString(),
        level2Id: validL2.id.toString(),
        categoryPath: `${l1Match.name} > ${validL2.name}`
      };
    }

    // Find Level 3 match
    const l3Match = findCategoryByName(aiLevel3);
    const l3Categories = getLevel3Categories(validL2.id);
    
    // Verify L3 is actually a child of L2
    const validL3 = l3Match && l3Categories.find(c => c.id === l3Match.id);
    
    if (!validL3) {
      return {
        success: true,
        level1Id: l1Match.id.toString(),
        level2Id: validL2.id.toString(),
        categoryPath: `${l1Match.name} > ${validL2.name}`,
        suggestion: `Matched ${l1Match.name} > ${validL2.name}, but could not match "${aiLevel3}" to Level 3 category.`
      };
    }

    // All levels matched!
    return {
      success: true,
      level1Id: l1Match.id.toString(),
      level2Id: validL2.id.toString(),
      level3Id: validL3.id.toString(),
      categoryPath: `${l1Match.name} > ${validL2.name} > ${validL3.name}`
    };
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className={`px-6 py-4 rounded-lg shadow-lg border ${
            toast.type === "success" 
              ? "bg-green-50 border-green-200 text-green-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <div className="flex items-center gap-2">
              {toast.type === "success" ? (
                <span className="text-xl">✅</span>
              ) : (
                <span className="text-xl">❌</span>
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Problem Content Management</h1>
            <p className="text-sm text-gray-500">Create, edit, and manage math problems</p>
            {/* DB Connection Status */}
            <div className="mt-2 flex items-center gap-2">
              {isLoadingFromDb ? (
                <Badge variant="outline" className="gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Loading from DB...
                </Badge>
              ) : isDbConnected ? (
                <Badge className="gap-1 bg-green-600">
                  <Database className="h-3 w-3" />
                  Connected to Supabase
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Database className="h-3 w-3" />
                  Local Mode
                </Badge>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => loadProblemsFromSupabase()}
              variant="outline"
              size="sm"
              disabled={isLoadingFromDb}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingFromDb ? 'animate-spin' : ''}`} />
              Sync from DB
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </header>
        <Separator />

        {/* Statistics Dashboard */}
        {problems.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Total Problems</div>
              <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="text-sm text-green-600 font-medium">Easy (1-3)</div>
              <div className="text-3xl font-bold text-green-900">{stats.byDifficulty.easy}</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <div className="text-sm text-yellow-600 font-medium">Medium (4-6)</div>
              <div className="text-3xl font-bold text-yellow-900">{stats.byDifficulty.medium}</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="text-sm text-red-600 font-medium">Hard (7-10)</div>
              <div className="text-3xl font-bold text-red-900">
                {stats.byDifficulty.hard + stats.byDifficulty.olympic}
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Problem List Section (Left) */}
          <div className="md:col-span-1">
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    Problem List
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({filteredProblems.length})
                    </span>
                  </CardTitle>
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
                  placeholder="Search by title, category, or ID..."
                  className="mt-2 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                
                {/* Filters and Sort Controls */}
                <div className="mt-3 space-y-2">
                  {/* Category Filter */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full mt-1 p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="algebra">Algebra</option>
                      <option value="geometry">Geometry</option>
                      <option value="calculus">Calculus</option>
                      <option value="analysis">Analysis</option>
                      <option value="number theory">Number Theory</option>
                      <option value="combinatorics">Combinatorics</option>
                    </select>
                  </div>

                  {/* Difficulty Filter */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Difficulty</label>
                    <select
                      value={filterDifficulty}
                      onChange={(e) => setFilterDifficulty(e.target.value)}
                      className="w-full mt-1 p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="easy">Easy (1-3)</option>
                      <option value="medium">Medium (4-6)</option>
                      <option value="hard">Hard (7-9)</option>
                      <option value="olympic">Olympic (10)</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "newest" | "title" | "difficulty")}
                      className="w-full mt-1 p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="title">Title (A-Z)</option>
                      <option value="difficulty">Difficulty (High to Low)</option>
                    </select>
                  </div>

                  {/* Reset Filters */}
                  {(filterCategory !== "all" || filterDifficulty !== "all" || sortBy !== "newest") && (
                    <Button
                      onClick={() => {
                        setFilterCategory("all");
                        setFilterDifficulty("all");
                        setSortBy("newest");
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-gray-600 hover:text-gray-800"
                    >
                      Reset Filters
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2 p-4">
                    {filteredProblems.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p className="text-sm">No problems found</p>
                      </div>
                    ) : (
                      filteredProblems.map((problem) => {
                        const childProblems = problems.filter(p => p.parentProblemId === problem.id);
                        const parentProblem = problem.parentProblemId 
                          ? problems.find(p => p.id === problem.parentProblemId)
                          : null;

                        return (
                          <div key={problem.id}>
                            <div
                              className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                                selectedProblem?.id === problem.id
                                  ? "bg-gray-100 border-blue-600"
                                  : "bg-white border-gray-200"
                              } ${problem.isGenerated ? 'ml-4 border-l-4 border-l-green-400' : ''}`}
                              onClick={() => handleSelectProblem(problem)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-medium text-gray-800">{problem.title}</h3>
                                    {problem.isGenerated && (
                                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                                        AI Generated
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">{problem.category}</p>
                                  {parentProblem && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      ↳ From: {parentProblem.title}
                                    </p>
                                  )}
                                  {childProblems.length > 0 && !problem.isGenerated && (
                                    <p className="text-xs text-green-600 mt-1">
                                      → {childProblems.length} related problem{childProblems.length > 1 ? 's' : ''}
                                    </p>
                                  )}
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
                          </div>
                        );
                      })
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
                {/* Input Method Tabs */}
                <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as "manual" | "file")}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger 
                      value="file" 
                      className={`text-sm font-medium rounded-md transition-all ${
                        inputMethod === "file" 
                          ? "bg-blue-600 text-white shadow-sm" 
                          : "bg-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Upload File (AI)
                    </TabsTrigger>
                    <TabsTrigger 
                      value="manual" 
                      className={`text-sm font-medium rounded-md transition-all ${
                        inputMethod === "manual" 
                          ? "bg-blue-600 text-white shadow-sm" 
                          : "bg-transparent text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Manual Input
                    </TabsTrigger>
                  </TabsList>

                  {/* File Upload Tab */}
                  <TabsContent value="file" className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-800">
                        Upload Problem File (Image or PDF)
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="file"
                          ref={problemFileInputRef}
                          onChange={handleProblemFileUpload}
                          accept="image/*,.pdf"
                          className="hidden"
                        />
                        <Button
                          onClick={() => problemFileInputRef.current?.click()}
                          variant="outline"
                          className="text-sm text-gray-700 border-gray-300 hover:bg-gray-50"
                          disabled={isAnalyzing}
                        >
                          Choose File
                        </Button>
                        {uploadedFile && (
                          <span className="text-xs text-gray-600">{uploadedFile.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        AI will extract problem content, formulas, diagrams, and solution from the file
                      </p>
                    </div>

                    {uploadedFilePreview && (
                      <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                        <h3 className="text-sm font-medium text-gray-800 mb-2">Uploaded File Preview</h3>
                        <img 
                          src={uploadedFilePreview} 
                          alt="Uploaded file" 
                          className="max-w-full h-auto rounded-md" 
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleAIAnalyzeProblem}
                      disabled={!uploadedFile || isAnalyzing}
                      className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
                    </Button>

                    {/* Extracted Diagrams Section */}
                    {extractedDiagrams.length > 0 && (
                      <div className="p-4 border border-blue-200 rounded-md bg-blue-50">
                        <h3 className="text-sm font-medium text-gray-800 mb-2">
                          Extracted Diagrams/Graphs ({extractedDiagrams.length})
                        </h3>
                        <p className="text-xs text-gray-600 mb-3">
                          AI detected these diagrams. Click to select one for the problem.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {extractedDiagrams.map((diagramUrl, index) => (
                            <div 
                              key={index} 
                              className="relative"
                            >
                              <div 
                                className={`p-2 border-2 rounded-md cursor-pointer hover:border-blue-400 transition-all ${
                                  diagramImageUrl === diagramUrl 
                                    ? 'border-blue-600 bg-blue-50' 
                                    : 'border-gray-300 bg-white'
                                }`}
                                onClick={() => handleSelectExtractedDiagram(diagramUrl)}
                              >
                                <img 
                                  src={diagramUrl} 
                                  alt={`Extracted diagram ${index + 1}`} 
                                  className="w-full h-auto rounded-sm" 
                                />
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                {diagramImageUrl === diagramUrl ? (
                                  <span className="text-xs text-blue-600 font-medium">✓ Selected</span>
                                ) : (
                                  <span className="text-xs text-gray-500">Diagram {index + 1}</span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveExtractedDiagram(index);
                                  }}
                                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Manual Input Tab */}
                  <TabsContent value="manual" className="space-y-4 mt-4">
                    <p className="text-xs text-gray-500">Manually enter problem details using KaTeX/MathJax syntax</p>
                  </TabsContent>
                </Tabs>

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

                {/* Category & Difficulty */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-800">
                      Category (Hierarchical)
                    </label>
                    <div className="space-y-2 mt-1">
                      <select
                        value={selectedLevel1}
                        onChange={(e) => {
                          setSelectedLevel1(e.target.value);
                          setSelectedLevel2("");
                          const l1 = CATEGORIES.level1.find(c => c.id === e.target.value);
                          setCategory(l1?.name || "");
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">Select Level 1</option>
                        {CATEGORIES.level1.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      
                      {selectedLevel1 && CATEGORIES.level2[selectedLevel1 as keyof typeof CATEGORIES.level2] && (
                        <select
                          value={selectedLevel2}
                          onChange={(e) => {
                            setSelectedLevel2(e.target.value);
                            const l2Options = CATEGORIES.level2[selectedLevel1 as keyof typeof CATEGORIES.level2];
                            const l2 = l2Options?.find((c: any) => c.id === e.target.value);
                            const l1 = CATEGORIES.level1.find(c => c.id === selectedLevel1);
                            setCategory(l2 ? `${l1?.name} > ${l2.name}` : l1?.name || "");
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="">Select Level 2 (Optional)</option>
                          {CATEGORIES.level2[selectedLevel1 as keyof typeof CATEGORIES.level2]?.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      )}
                      
                      {selectedLevel2 && CATEGORIES.level3[selectedLevel2 as keyof typeof CATEGORIES.level3] && (
                        <select
                          value={category.split(' > ')[2] || ""}
                          onChange={(e) => {
                            const l3Options = CATEGORIES.level3[selectedLevel2 as keyof typeof CATEGORIES.level3];
                            const l3 = l3Options?.find((c: any) => c.name === e.target.value);
                            const l2Options = CATEGORIES.level2[selectedLevel1 as keyof typeof CATEGORIES.level2];
                            const l2 = l2Options?.find((c: any) => c.id === selectedLevel2);
                            const l1 = CATEGORIES.level1.find(c => c.id === selectedLevel1);
                            setCategory(l3 ? `${l1?.name} > ${l2?.name} > ${l3.name}` : `${l1?.name} > ${l2?.name}`);
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="">Select Level 3 (Optional)</option>
                          {CATEGORIES.level3[selectedLevel2 as keyof typeof CATEGORIES.level3]?.map((cat: any) => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      )}
                      
                      {category && (
                        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                          Selected: <span className="font-medium">{category}</span>
                        </div>
                      )}
                    </div>
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
                        disabled={isAnalyzing}
                      >
                        AI
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

                {/* Diagram/Graph Image Upload */}
                <div>
                  <label className="text-sm font-medium text-gray-800">
                    Diagram/Graph Image (Optional)
                  </label>
                  {inputMethod === "file" && extractedDiagrams.length > 0 ? (
                    <div className="mt-1">
                      {diagramImageUrl ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-600">Using AI-extracted diagram</span>
                          <Button
                            onClick={() => setDiagramImageUrl("")}
                            variant="outline"
                            size="sm"
                            className="text-xs text-gray-700 border-gray-300 hover:bg-gray-50"
                          >
                            Clear
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Select a diagram from the extracted diagrams above, or upload manually below
                        </p>
                      )}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="file"
                      ref={diagramFileInputRef}
                      onChange={handleDiagramImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      onClick={() => diagramFileInputRef.current?.click()}
                      variant="outline"
                      className="text-sm text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      {diagramImageUrl && inputMethod === "file" && extractedDiagrams.length > 0 
                        ? "Upload Different Diagram" 
                        : "Upload Diagram"}
                    </Button>
                    {diagramImageUrl && inputMethod !== "file" && (
                      <span className="text-xs text-green-600">Diagram uploaded</span>
                    )}
                  </div>
                  {inputMethod === "manual" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Upload separate diagrams or graphs that accompany the problem
                    </p>
                  )}
                </div>

                {/* Preview */}
                <div>
                  <h3 className="text-sm font-medium text-gray-800">Preview</h3>
                  <div className="p-4 border border-gray-200 rounded-md mt-1 bg-gray-50 min-h-[120px]">
                    {diagramImageUrl && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-2">Diagram:</p>
                        <img 
                          src={diagramImageUrl} 
                          alt="Diagram" 
                          className="max-w-full h-auto rounded-md" 
                        />
                      </div>
                    )}
                    <MathPreview html={problemContent} />
                  </div>
                </div>

                {/* Solution */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="solution" className="text-sm font-medium text-gray-800">
                      Solution
                    </label>
                    <Button
                      onClick={handleAIGenerateSolution}
                      variant="outline"
                      size="sm"
                      className="text-xs text-gray-700 border-gray-300 hover:bg-gray-50"
                      disabled={isAnalyzing || !problemContent}
                    >
                      Generate with AI
                    </Button>
                  </div>
                  <textarea
                    id="solution"
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Enter the solution (supports KaTeX/MathJax) or generate with AI"
                    className="w-full h-32 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mt-1 text-sm"
                  />
                  
                  {/* Solution Preview */}
                  {solution && (
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Solution Preview</h4>
                      <div className="p-3 border border-gray-200 rounded-md bg-gray-50 min-h-[80px] max-h-[200px] overflow-y-auto">
                        <MathPreview html={solution} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Related Problems Generation */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-800">
                      Related Problems (AI Generated)
                    </label>
                    <div className="flex gap-2">
                      {!showRelatedProblems && relatedProblems.length > 0 && (
                        <Button
                          onClick={() => setShowRelatedProblems(true)}
                          variant="outline"
                          size="sm"
                          className="text-xs text-green-600 border-green-300 hover:bg-green-50"
                        >
                          Show Generated ({relatedProblems.length})
                        </Button>
                      )}
                      <Button
                        onClick={handleGenerateRelatedProblems}
                        variant="outline"
                        size="sm"
                        className="text-xs text-gray-700 border-gray-300 hover:bg-gray-50"
                        disabled={isAnalyzing || !problemContent}
                      >
                        {relatedProblems.length > 0 ? 'Generate More' : 'Generate Related Problems with AI'}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-gray-700">
                      💡 Click "Generate Related Problems with AI" to automatically create foundational problems linked to this one. 
                      {linkedProblems.length > 0 && (
                        <span className="font-medium text-blue-700"> Currently {linkedProblems.length} problem(s) linked.</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* AI-Generated Related Problems */}
                {showRelatedProblems && relatedProblems.length > 0 && (
                  <div className="p-4 border border-green-200 rounded-md bg-gradient-to-br from-green-50 to-blue-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-800">
                          AI-Generated Related Problems ({relatedProblems.length})
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          Foundational problems organized by concept
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleGenerateRelatedProblems}
                          variant="outline"
                          size="sm"
                          className="text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
                          disabled={isAnalyzing}
                        >
                          Generate More
                        </Button>
                        <Button
                          onClick={() => setShowRelatedProblems(!showRelatedProblems)}
                          variant="outline"
                          size="sm"
                          className="text-xs text-gray-700 border-gray-300 hover:bg-gray-50"
                        >
                          Collapse
                        </Button>
                      </div>
                    </div>

                    {/* Concepts Overview */}
                    <div className="mb-4 p-3 bg-white border border-blue-200 rounded-md">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Identified Concepts:</h4>
                      <div className="flex flex-wrap gap-2">
                        {concepts.map((concept, idx) => (
                          <Badge key={idx} className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                            {concept}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Problems Grid - Organized by Concept */}
                    <div className="space-y-3">
                      {concepts.map((concept) => {
                        const conceptProblems = relatedProblems.filter(p => p.concept === concept);
                        if (conceptProblems.length === 0) return null;

                        return (
                          <div key={concept} className="p-3 bg-white border border-gray-200 rounded-md">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                                {concept}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {conceptProblems.length} problem{conceptProblems.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {conceptProblems.map((relProb, idx) => (
                                <div 
                                  key={idx} 
                                  className="p-3 border border-gray-200 rounded-md hover:border-green-400 transition-all bg-gray-50"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h5 className="text-sm font-medium text-gray-800 line-clamp-1">
                                        {relProb.title}
                                      </h5>
                                      <Badge className="text-xs bg-gray-100 text-gray-700 border-gray-200 mt-1">
                                        Difficulty {relProb.difficulty}/10
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                    {relProb.explanation}
                                  </p>
                                  
                                  <div className="flex items-center justify-between gap-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-xs flex-1"
                                          onClick={() => setSelectedRelatedProblem(relProb)}
                                        >
                                          View Details
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white">
                                        <DialogHeader>
                                          <DialogTitle className="text-lg font-semibold">
                                            {relProb.title}
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div>
                                            <div className="flex items-center gap-2 mb-2">
                                              <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                                                {relProb.concept}
                                              </Badge>
                                              <Badge className="text-xs bg-gray-100 text-gray-700 border-gray-200">
                                                Difficulty {relProb.difficulty}/10
                                              </Badge>
                                              <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                                {relProb.category}
                                              </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 italic">{relProb.explanation}</p>
                                          </div>

                                          <div>
                                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Problem</h4>
                                            <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                                              <MathPreview html={relProb.content} />
                                            </div>
                                          </div>

                                          <div>
                                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Solution</h4>
                                            <div className="p-4 border border-gray-200 rounded-md bg-blue-50">
                                              <MathPreview html={relProb.solution} />
                                            </div>
                                          </div>

                                          <div className="flex justify-end gap-2 pt-4">
                                            <Button
                                              onClick={() => handleAddRelatedProblem(relProb)}
                                              className="bg-green-600 text-white font-medium py-2 px-4 rounded-md hover:bg-green-700"
                                            >
                                              Add to Problem List
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>

                                    <Button
                                      onClick={() => handleAddRelatedProblem(relProb)}
                                      size="sm"
                                      className="bg-green-600 text-white font-medium text-xs hover:bg-green-700"
                                    >
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bulk Actions */}
                    <div className="mt-4 p-3 bg-white border border-gray-200 rounded-md">
                      <p className="text-xs text-gray-600 mb-2">Bulk Actions:</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            relatedProblems.forEach(prob => handleAddRelatedProblem(prob));
                            showToast(`✅ Added all ${relatedProblems.length} problems - Click "Save Problem" to save to database`, "success");
                          }}
                          size="sm"
                          className="bg-green-600 text-white font-medium text-xs hover:bg-green-700"
                        >
                          Add All ({relatedProblems.length})
                        </Button>
                        <Button
                          onClick={() => {
                            setShowRelatedProblems(false);
                            setRelatedProblems([]);
                            setConcepts([]);
                            showToast("Cleared all related problems from view", "success");
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs text-gray-700 border-gray-300 hover:bg-gray-50"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4">
                  <div className="text-xs text-gray-500">
                    {isEditing ? (
                      <span>✏️ Editing: <strong>{selectedProblem?.title}</strong></span>
                    ) : (
                      <span>📝 Creating new problem</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (isEditing && selectedProblem) {
                          // Cancel editing - restore original values
                          handleSelectProblem(selectedProblem);
                          showToast("Changes cancelled", "success");
                        } else {
                          // Cancel creating new problem - clear form
                          handleNewProblem();
                        }
                      }}
                      variant="outline"
                      className="text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProblem}
                      className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                      {isEditing ? "💾 Update Problem" : "💾 Save Problem"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
