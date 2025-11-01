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
  const [viewMode, setViewMode] = useState<"list" | "grid" | "learning-path">("list");
  
  // Expanded problems state (for showing linked problems)
  const [expandedProblems, setExpandedProblems] = useState<Set<string>>(new Set());
  
  // Editor dialog state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Drag and drop states for linking
  const [draggedProblemId, setDraggedProblemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkType, setLinkType] = useState<'prerequisite' | 'derived' | 'related' | 'next' | 'alternative'>('derived');
  const [linkConcept, setLinkConcept] = useState("");
  const [showLinkManagerDialog, setShowLinkManagerDialog] = useState(false);
  const [linkManagerProblemId, setLinkManagerProblemId] = useState<string | null>(null);
  
  // Visual link editing states
  const [linkEditMode, setLinkEditMode] = useState(false);
  const [linkEditSourceId, setLinkEditSourceId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);
  const [linkEditSourcePosition, setLinkEditSourcePosition] = useState<{x: number, y: number} | null>(null);
  
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

  // ESC key listener for canceling link edit mode
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && linkEditMode) {
        handleCancelLinkEdit();
        showToast('❌ 링크 편집이 취소되었습니다', 'error');
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [linkEditMode]);
  
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
  
  // Toggle expanded state for a problem
  const toggleExpanded = (problemId: string) => {
    setExpandedProblems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(problemId)) {
        newSet.delete(problemId);
      } else {
        newSet.add(problemId);
      }
      return newSet;
    });
  };

  // Drag and Drop handlers for creating links
  const handleDragStart = (e: React.DragEvent, problemId: string) => {
    console.log('🎯 Drag started:', problemId);
    setDraggedProblemId(problemId);
    e.dataTransfer.effectAllowed = 'link';
    e.dataTransfer.setData('text/plain', problemId);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('🏁 Drag ended');
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    // Don't reset immediately - let drop handler complete first
    setTimeout(() => {
      if (!showLinkDialog) {
        setDraggedProblemId(null);
        setDropTargetId(null);
      }
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent, problemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'link';
    if (draggedProblemId && draggedProblemId !== problemId) {
      setDropTargetId(problemId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, problemId: string) => {
    if (dropTargetId === problemId) {
      setDropTargetId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetProblemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📍 Drop on:', targetProblemId, 'from:', draggedProblemId);
    
    if (!draggedProblemId || draggedProblemId === targetProblemId) {
      console.log('⚠️ Invalid drop: same problem or no source');
      setDraggedProblemId(null);
      setDropTargetId(null);
      return;
    }

    // Check if link already exists
    const sourceProblem = problems.find(p => p.id === draggedProblemId);
    const targetProblem = problems.find(p => p.id === targetProblemId);
    
    if (!sourceProblem || !targetProblem) {
      console.log('⚠️ Problem not found');
      return;
    }

    // Check for existing link
    const hasExistingLink = sourceProblem.linkedProblems?.includes(targetProblemId) ||
                           targetProblem.linkedProblems?.includes(draggedProblemId) ||
                           sourceProblem.parentProblemId === targetProblemId ||
                           targetProblem.parentProblemId === draggedProblemId;

    if (hasExistingLink) {
      showToast("❌ Link already exists between these problems", "error");
      setDraggedProblemId(null);
      setDropTargetId(null);
      return;
    }

    // Open dialog to select link type
    console.log('✅ Opening link dialog');
    setShowLinkDialog(true);
  };

  const handleCreateLink = async () => {
    if (!draggedProblemId || !dropTargetId) {
      console.error('⚠️ Missing IDs:', { draggedProblemId, dropTargetId });
      return;
    }

    console.log('🔗 Creating link:', {
      from: draggedProblemId,
      to: dropTargetId,
      type: linkType,
      concept: linkConcept
    });

    try {
      // Create relationship in problem_relationships table
      console.log('📝 Saving to problem_relationships...');
      await problemRelationshipsAPI.create(
        draggedProblemId,
        dropTargetId,
        linkType,
        {
          concept: linkConcept || 'Manual Link',
          description: `${linkType} relationship created via drag & drop`,
          strength: 0.8,
          sequenceOrder: 0
        }
      );
      console.log('✅ Relationship created in DB');

      // Update local state
      setProblems(prev => prev.map(p => {
        if (p.id === draggedProblemId) {
          const newLinkedProblems = [...(p.linkedProblems || []), dropTargetId];
          return { ...p, linkedProblems: newLinkedProblems };
        }
        return p;
      }));
      console.log('✅ Local state updated');

      // Update in database
      const sourceProblem = problems.find(p => p.id === draggedProblemId);
      if (sourceProblem) {
        const updatedLinkedIds = [...(sourceProblem.linkedProblems || []), dropTargetId];
        console.log('📝 Updating linked_problem_ids in problems table...');
        await problemsAPI.update(draggedProblemId, {
          linked_problem_ids: updatedLinkedIds
        });
        console.log('✅ Problems table updated');
      }

      showToast(`✅ Created ${linkType} link successfully!`, "success");
      
      // Reset states
      setShowLinkDialog(false);
      setDraggedProblemId(null);
      setDropTargetId(null);
      setLinkConcept("");
      
      // Refresh from database
      console.log('🔄 Refreshing from database...');
      await loadProblemsFromSupabase();
      console.log('✅ Link creation complete!');
      
    } catch (error: any) {
      console.error('❌ Failed to create link:', error);
      console.error('Error details:', error.message, error.stack);
      showToast(`❌ Failed to create link: ${error.message}`, "error");
    }
  };

  const handleDeleteLink = async (sourceProblemId: string, targetProblemId: string) => {
    const sourceProblem = problems.find(p => p.id === sourceProblemId);
    const targetProblem = problems.find(p => p.id === targetProblemId);
    
    if (!confirm(`이 링크를 삭제하시겠습니까?\n\n"${sourceProblem?.title}"\n↓\n"${targetProblem?.title}"`)) return;

    console.log('🗑️ Deleting link:', { from: sourceProblemId, to: targetProblemId });

    try {
      // Remove from local state
      setProblems(prev => prev.map(p => {
        if (p.id === sourceProblemId) {
          const newLinkedProblems = (p.linkedProblems || []).filter(id => id !== targetProblemId);
          return { ...p, linkedProblems: newLinkedProblems };
        }
        if (p.id === targetProblemId && p.parentProblemId === sourceProblemId) {
          return { ...p, parentProblemId: undefined };
        }
        return p;
      }));

      // Update in database
      if (sourceProblem) {
        const updatedLinkedIds = (sourceProblem.linkedProblems || []).filter(id => id !== targetProblemId);
        console.log('📝 Updating problems table...');
        await problemsAPI.update(sourceProblemId, {
          linked_problem_ids: updatedLinkedIds
        });
        console.log('✅ Problems table updated');
      }

      showToast("✅ 링크가 삭제되었습니다", "success");
      
      // Refresh from database
      console.log('🔄 Refreshing from database...');
      await loadProblemsFromSupabase();
      console.log('✅ Link deletion complete!');
      
    } catch (error: any) {
      console.error('❌ Failed to delete link:', error);
      showToast(`❌ 링크 삭제 실패: ${error.message}`, "error");
    }
  };

  // Visual link editing handlers
  const handleStartLinkEdit = (e: React.MouseEvent, problemId: string) => {
    e.stopPropagation();
    
    // Get the button element position (not the card)
    const buttonRect = e.currentTarget.getBoundingClientRect();
    const scrollContainer = document.querySelector('.h-\\[600px\\]'); // ScrollArea
    const containerRect = scrollContainer?.getBoundingClientRect() || { left: 0, top: 0 };
    const scrollTop = (scrollContainer as HTMLElement)?.scrollTop || 0;
    const scrollLeft = (scrollContainer as HTMLElement)?.scrollLeft || 0;
    
    setLinkEditMode(true);
    setLinkEditSourceId(problemId);
    
    // Position from button center (relative to scroll container)
    setLinkEditSourcePosition({
      x: buttonRect.left - containerRect.left + buttonRect.width / 2 + scrollLeft,
      y: buttonRect.top - containerRect.top + buttonRect.height / 2 + scrollTop
    });
    
    console.log('🔗 Link edit mode started for:', problemId);
    showToast('📌 새로운 부모 문제를 클릭하세요 (ESC: 취소)', 'success');
  };

  const handleCancelLinkEdit = () => {
    setLinkEditMode(false);
    setLinkEditSourceId(null);
    setMousePosition(null);
    setLinkEditSourcePosition(null);
    console.log('❌ Link edit cancelled');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (linkEditMode && linkEditSourcePosition) {
      const scrollContainer = e.currentTarget.closest('.h-\\[600px\\]');
      const rect = scrollContainer?.getBoundingClientRect() || { left: 0, top: 0 };
      const scrollTop = (scrollContainer as HTMLElement)?.scrollTop || 0;
      const scrollLeft = (scrollContainer as HTMLElement)?.scrollLeft || 0;
      
      setMousePosition({
        x: e.clientX - rect.left + scrollLeft,
        y: e.clientY - rect.top + scrollTop
      });
    }
  };

  const handleChangeLinkParent = async (newParentId: string) => {
    if (!linkEditSourceId) return;
    
    const sourceProblem = problems.find(p => p.id === linkEditSourceId);
    const newParentProblem = problems.find(p => p.id === newParentId);
    const oldParentProblem = sourceProblem?.parentProblemId 
      ? problems.find(p => p.id === sourceProblem.parentProblemId)
      : null;
    
    if (!sourceProblem || !newParentProblem) return;
    if (linkEditSourceId === newParentId) {
      showToast('❌ 자기 자신을 부모로 설정할 수 없습니다', 'error');
      handleCancelLinkEdit();
      return;
    }
    
    // Check for circular dependency
    let current: Problem | undefined = newParentProblem;
    while (current) {
      if (current.id === linkEditSourceId) {
        showToast('❌ 순환 참조가 발생합니다', 'error');
        handleCancelLinkEdit();
        return;
      }
      current = problems.find(p => p.id === current!.parentProblemId);
    }
    
    const oldParentName = oldParentProblem?.title || '(없음)';
    const confirmMessage = `부모 문제를 변경하시겠습니까?\n\n"${sourceProblem.title}"\n\n이전 부모: "${oldParentName}"\n  ↓\n새 부모: "${newParentProblem.title}"`;
    
    if (!confirm(confirmMessage)) {
      handleCancelLinkEdit();
      return;
    }

    console.log('🔄 Changing parent:', {
      child: linkEditSourceId,
      childTitle: sourceProblem.title,
      oldParent: sourceProblem.parentProblemId,
      oldParentTitle: oldParentName,
      newParent: newParentId,
      newParentTitle: newParentProblem.title
    });

    // Optimistic UI update - update local state immediately
    setProblems(prev => prev.map(p => {
      if (p.id === linkEditSourceId) {
        // Update child's parent
        return { ...p, parentProblemId: newParentId };
      }
      if (p.id === sourceProblem.parentProblemId) {
        // Remove from old parent's links
        return { 
          ...p, 
          linkedProblems: (p.linkedProblems || []).filter(id => id !== linkEditSourceId)
        };
      }
      if (p.id === newParentId) {
        // Add to new parent's links
        const newLinks = [...(p.linkedProblems || [])];
        if (!newLinks.includes(linkEditSourceId)) {
          newLinks.push(linkEditSourceId);
        }
        return { ...p, linkedProblems: newLinks };
      }
      return p;
    }));
    
    handleCancelLinkEdit();
    showToast('🔄 위치를 업데이트하는 중...', 'success');

    try {
      // Update old parent's linked_problem_ids
      if (sourceProblem.parentProblemId) {
        const oldParent = problems.find(p => p.id === sourceProblem.parentProblemId);
        if (oldParent) {
          const updatedOldParentLinks = (oldParent.linkedProblems || []).filter(id => id !== linkEditSourceId);
          await problemsAPI.update(oldParent.id, {
            linked_problem_ids: updatedOldParentLinks
          });
        }
      }

      // Update new parent's linked_problem_ids
      const updatedNewParentLinks = [...(newParentProblem.linkedProblems || []), linkEditSourceId];
      await problemsAPI.update(newParentId, {
        linked_problem_ids: updatedNewParentLinks
      });

      // Update child's parent_problem_id
      await problemsAPI.update(linkEditSourceId, {
        parent_problem_id: newParentId
      });

      // Refresh from database to ensure consistency
      await loadProblemsFromSupabase();
      
      showToast(`✅ "${sourceProblem.title}"이(가) "${newParentProblem.title}" 아래로 이동했습니다`, 'success');
      
    } catch (error: any) {
      console.error('❌ Failed to change parent:', error);
      showToast(`❌ 부모 변경 실패: ${error.message}`, 'error');
      
      // Revert optimistic update by reloading
      await loadProblemsFromSupabase();
    }
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
    setIsEditorOpen(true); // Open the editor dialog
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
          if (savedProblem) {
            updatedProblem.id = savedProblem.id;
          }
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
          if (savedProblem) {
            newProblem.id = savedProblem.id;
          }
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
    
    // Create ID mapping to track temp IDs -> real UUIDs (for hierarchical structure)
    const idMapping = new Map<string, string>();
    idMapping.set(parentProblemId, parentProblemId);
    if (oldParentId) {
      idMapping.set(oldParentId, parentProblemId);
    }
    
    const savedDerivedIds: string[] = [];
    let successCount = 0;
    
    // Helper function to save problem hierarchy recursively
    const saveProblemHierarchy = async (problemId: string, depth: number = 0): Promise<void> => {
      const problem = currentProblems.find(p => p.id === problemId);
      if (!problem || !problemId.startsWith('temp-derived-')) {
        return;
      }
      
      try {
        // Resolve parent ID from mapping (handle nested derived problems)
        let actualParentId = problem.parentProblemId;
        if (actualParentId && idMapping.has(actualParentId)) {
          actualParentId = idMapping.get(actualParentId)!;
          console.log(`${'  '.repeat(depth)}🔄 Resolved parent ${problem.parentProblemId} → ${actualParentId}`);
        }
        
        console.log(`${'  '.repeat(depth)}📝 [Depth ${depth}] Saving: "${problem.title}"`);
        
        const problemToSave = {
          ...problem,
          parentProblemId: actualParentId,
        };
        
        const savedProblem = await saveProblemToSupabase(problemToSave);
        
        if (!savedProblem) {
          console.error(`${'  '.repeat(depth)}❌ Failed to save: "${problem.title}"`);
          return;
        }
        
        const oldId = problem.id;
        const newId = savedProblem.id;
        
        console.log(`${'  '.repeat(depth)}✅ Saved: ${newId} (was ${oldId})`);
        
        // Store mapping for children
        idMapping.set(oldId, newId);
        
        // Update local state
        setProblems(prev => prev.map(p => {
          if (p.id === oldId) {
            return { ...p, id: newId, parentProblemId: actualParentId };
          }
          if (p.parentProblemId === oldId) {
            return { ...p, parentProblemId: newId };
          }
          return p;
        }));
        
        savedDerivedIds.push(newId);
        
        // Create relationship
        try {
          const relatedProblem = relatedProblems.find(rp => rp.title === problem.title);
          await problemRelationshipsAPI.create(
            actualParentId!,
            newId,
            'derived',
            {
              concept: relatedProblem?.concept || 'AI Generated',
              description: relatedProblem?.explanation || `Derived (Level ${depth + 1})`,
              strength: 0.8,
              sequenceOrder: depth
            }
          );
          console.log(`${'  '.repeat(depth)}🔗 Relationship: ${actualParentId} → ${newId}`);
        } catch (relError: any) {
          console.warn(`${'  '.repeat(depth)}⚠️ Relationship failed:`, relError.message);
        }
        
        // Update parent's linked_problem_ids
        try {
          const parent = await problemsAPI.getById(actualParentId!);
          const updatedLinkedIds = [...(parent.linked_problem_ids || []).filter(id => !id.startsWith('temp-')), newId];
          await problemsAPI.update(actualParentId!, { linked_problem_ids: updatedLinkedIds });
          
          if (actualParentId === parentProblemId) {
            setLinkedProblems(prev => {
              const filtered = prev.filter(id => !id.startsWith('temp-'));
              return filtered.includes(newId) ? filtered : [...filtered, newId];
            });
          }
        } catch (error: any) {
          console.warn(`${'  '.repeat(depth)}⚠️ Failed to update parent:`, error.message);
        }
        
        successCount++;
        
        // Save children recursively
        const children = currentProblems.filter(p => 
          p.parentProblemId === oldId && p.id.startsWith('temp-derived-')
        );
        
        if (children.length > 0) {
          console.log(`${'  '.repeat(depth)}👶 ${children.length} child(ren) of "${problem.title}"`);
          for (const child of children) {
            await saveProblemHierarchy(child.id, depth + 1);
          }
        }
        
      } catch (error: any) {
        console.error(`${'  '.repeat(depth)}❌ Failed to save "${problem.title}":`, error.message);
      }
    };
    
    // Start saving from direct children
    for (const derivedProblem of derivedProblems) {
      await saveProblemHierarchy(derivedProblem.id, 0);
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
      // Only show root problems (not derived problems)
      const isRootProblem = !p.parentProblemId;
      
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
      
      return isRootProblem && matchesSearch && matchesCategory && matchesDifficulty;
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
            <Button
              onClick={() => {
                handleNewProblem();
                setIsEditorOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              size="sm"
            >
              <span className="text-lg leading-none">+</span>
              New Problem
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

        {/* Problem List Section (Full Width) */}
        <div className="w-full">
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      Problem List
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({filteredProblems.length})
                      </span>
                    </CardTitle>
                    
                    {/* View Mode Switcher */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                          viewMode === "list"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-800"
                        }`}
                      >
                        📋 List
                      </button>
                      <button
                        onClick={() => setViewMode("learning-path")}
                        className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                          viewMode === "learning-path"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-800"
                        }`}
                      >
                        🌳 Learning Path
                      </button>
                    </div>
                  </div>
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
                  <div className={viewMode === "learning-path" ? "p-6" : "space-y-2 p-4"}>
                    {filteredProblems.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p className="text-sm">No problems found</p>
                      </div>
                    ) : viewMode === "learning-path" ? (
                      /* Learning Path View */
                      <div 
                        className="w-full overflow-x-auto relative"
                        onMouseMove={handleMouseMove}
                        onClick={() => {
                          if (linkEditMode) {
                            handleCancelLinkEdit();
                            showToast('❌ 링크 편집이 취소되었습니다', 'error');
                          }
                        }}
                      >
                        {/* Visual Link Line */}
                        {linkEditMode && linkEditSourcePosition && mousePosition && (
                          <svg 
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            style={{ zIndex: 9999 }}
                          >
                            <defs>
                              <marker
                                id="arrowhead-link-edit"
                                markerWidth="10"
                                markerHeight="10"
                                refX="9"
                                refY="3"
                                orient="auto"
                              >
                                <polygon points="0 0, 10 3, 0 6" fill="#3B82F6" />
                              </marker>
                            </defs>
                            <line
                              x1={linkEditSourcePosition.x}
                              y1={linkEditSourcePosition.y}
                              x2={mousePosition.x}
                              y2={mousePosition.y}
                              stroke="#3B82F6"
                              strokeWidth="3"
                              strokeDasharray="8,4"
                              markerEnd="url(#arrowhead-link-edit)"
                            />
                            <circle
                              cx={linkEditSourcePosition.x}
                              cy={linkEditSourcePosition.y}
                              r="6"
                              fill="#3B82F6"
                            />
                          </svg>
                        )}
                        
                        <div className="min-w-[1200px] relative">
                          {filteredProblems.map((rootProblem, rootIdx) => {
                            const derivedProblems = problems.filter(p => p.parentProblemId === rootProblem.id);
                            
                            return (
                              <div key={rootProblem.id} className="mb-12">
                                <h3 className="text-lg font-semibold text-gray-800 mb-6">
                                  {rootProblem.title}
                                </h3>
                                
                                <div className="relative flex gap-12">
                                  {/* Level 0: Root Problems */}
                                  <div className="flex flex-col gap-6">
                                  <div 
                                    className={`group transition-opacity ${
                                      linkEditMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                                    } ${draggedProblemId === rootProblem.id ? 'opacity-50' : 'opacity-100'}`}
                                    draggable={!linkEditMode}
                                    onDragStart={(e) => {
                                      if (!linkEditMode) {
                                        e.stopPropagation();
                                        handleDragStart(e, rootProblem.id);
                                      }
                                    }}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => {
                                      if (!linkEditMode) {
                                        e.stopPropagation();
                                        handleDragOver(e, rootProblem.id);
                                      }
                                    }}
                                    onDragLeave={(e) => !linkEditMode && handleDragLeave(e, rootProblem.id)}
                                    onDrop={(e) => {
                                      if (!linkEditMode) {
                                        e.stopPropagation();
                                        handleDrop(e, rootProblem.id);
                                      }
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (linkEditMode && linkEditSourceId !== rootProblem.id) {
                                        handleChangeLinkParent(rootProblem.id);
                                      } else if (!draggedProblemId && !linkEditMode) {
                                        handleSelectProblem(rootProblem);
                                      }
                                    }}
                                  >
                                    <div className={`
                                      relative p-4 rounded-xl border-2 bg-white shadow-md transition-all
                                      ${dropTargetId === rootProblem.id && draggedProblemId !== rootProblem.id
                                        ? 'border-green-500 border-dashed shadow-xl ring-4 ring-green-200'
                                        : selectedProblem?.id === rootProblem.id 
                                          ? 'border-blue-500 shadow-lg' 
                                          : 'border-gray-300 hover:border-blue-400 hover:shadow-lg'}
                                      w-64
                                    `}>
                                      {/* Link Edit Button */}
                                      {rootProblem.parentProblemId && (
                                        <button
                                          onClick={(e) => handleStartLinkEdit(e, rootProblem.id)}
                                          className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded transition-all ${
                                            linkEditSourceId === rootProblem.id
                                              ? 'bg-blue-500 text-white scale-110'
                                              : 'bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600'
                                          }`}
                                          title="부모 문제 변경"
                                        >
                                          🔗
                                        </button>
                                      )}
                                      
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">🔒</span>
                                        <div className="flex-1 pr-6">
                                          <div className="font-semibold text-sm text-gray-800">{rootProblem.title}</div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            {getDifficultyLabel(rootProblem.difficulty)} • D{rootProblem.difficulty}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-xs text-gray-400 truncate">{rootProblem.category}</div>
                                    </div>
                                  </div>
                                  </div>
                                  
                                  {/* Level 1: Derived Problems (Vertical) */}
                                  {derivedProblems.length > 0 && (
                                    <div className="flex flex-col gap-6">
                                      {derivedProblems.sort((a, b) => a.difficulty - b.difficulty).map((derived, idx) => {
                                          const grandchildren = problems.filter(p => p.parentProblemId === derived.id);
                                          
                                          return (
                                            <div key={derived.id} className="relative">
                                              {/* Connection Line */}
                                              <svg 
                                                className="absolute top-1/2 -left-8 w-8 h-4 pointer-events-none" 
                                                style={{transform: 'translateY(-50%)'}}
                                                viewBox="0 0 32 4"
                                              >
                                                <line x1="0" y1="2" x2="28" y2="2" stroke="#94A3B8" strokeWidth="2" />
                                                <polygon points="28,0 32,2 28,4" fill="#94A3B8" />
                                              </svg>
                                              
                                              <div 
                                                className={`group transition-opacity ${
                                                  linkEditMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                                                } ${draggedProblemId === derived.id ? 'opacity-50' : 'opacity-100'}`}
                                                draggable={!linkEditMode}
                                                onDragStart={(e) => {
                                                  if (!linkEditMode) {
                                                    e.stopPropagation();
                                                    handleDragStart(e, derived.id);
                                                  }
                                                }}
                                                onDragEnd={handleDragEnd}
                                                onDragOver={(e) => {
                                                  if (!linkEditMode) {
                                                    e.stopPropagation();
                                                    handleDragOver(e, derived.id);
                                                  }
                                                }}
                                                onDragLeave={(e) => !linkEditMode && handleDragLeave(e, derived.id)}
                                                onDrop={(e) => {
                                                  if (!linkEditMode) {
                                                    e.stopPropagation();
                                                    handleDrop(e, derived.id);
                                                  }
                                                }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (linkEditMode && linkEditSourceId !== derived.id) {
                                                    handleChangeLinkParent(derived.id);
                                                  } else if (!draggedProblemId && !linkEditMode) {
                                                    handleSelectProblem(derived);
                                                  }
                                                }}
                                              >
                                                <div className={`
                                                  relative p-4 rounded-xl border-2 bg-white shadow-md transition-all
                                                  ${dropTargetId === derived.id && draggedProblemId !== derived.id
                                                    ? 'border-green-500 border-dashed shadow-xl ring-4 ring-green-200'
                                                    : selectedProblem?.id === derived.id 
                                                      ? 'border-green-500 shadow-lg' 
                                                      : 'border-green-300 hover:border-green-500 hover:shadow-lg'}
                                                  w-56
                                                `}>
                                                  {/* Link Edit Button */}
                                                  <button
                                                    onClick={(e) => handleStartLinkEdit(e, derived.id)}
                                                    className={`absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded transition-all z-10 ${
                                                      linkEditSourceId === derived.id
                                                        ? 'bg-blue-500 text-white scale-110'
                                                        : 'bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600'
                                                    }`}
                                                    title="부모 문제 변경"
                                                  >
                                                    🔗
                                                  </button>
                                                  
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xl">🌱</span>
                                                    <div className="flex-1 pl-4">
                                                      <div className="font-semibold text-sm text-gray-800">{derived.title}</div>
                                                      <div className="text-xs text-gray-500 mt-1">
                                                        {getDifficultyLabel(derived.difficulty)} • D{derived.difficulty}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="text-xs text-gray-400 truncate">{derived.category}</div>
                                                  {derived.isGenerated && (
                                                    <div className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                      🤖 AI
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  
                                  {/* Level 2: Grandchildren (Vertical, Collected from all derived) */}
                                  {(() => {
                                    const allGrandchildren = derivedProblems.flatMap(derived => 
                                      problems.filter(p => p.parentProblemId === derived.id)
                                    );
                                    
                                    if (allGrandchildren.length === 0) return null;
                                    
                                    return (
                                      <div className="flex flex-col gap-6">
                                        {allGrandchildren.sort((a, b) => a.difficulty - b.difficulty).map((grandchild) => (
                                          <div key={grandchild.id} className="relative">
                                            {/* Connection Line */}
                                            <svg 
                                              className="absolute top-1/2 -left-8 w-8 h-4 pointer-events-none" 
                                              style={{transform: 'translateY(-50%)'}}
                                              viewBox="0 0 32 4"
                                            >
                                              <line x1="0" y1="2" x2="28" y2="2" stroke="#6EE7B7" strokeWidth="2" />
                                              <polygon points="28,0 32,2 28,4" fill="#6EE7B7" />
                                            </svg>
                                            
                                            <div 
                                              className={`group transition-opacity ${
                                                linkEditMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                                              } ${draggedProblemId === grandchild.id ? 'opacity-50' : 'opacity-100'}`}
                                              draggable={!linkEditMode}
                                              onDragStart={(e) => {
                                                if (!linkEditMode) {
                                                  e.stopPropagation();
                                                  handleDragStart(e, grandchild.id);
                                                }
                                              }}
                                              onDragEnd={handleDragEnd}
                                              onDragOver={(e) => {
                                                if (!linkEditMode) {
                                                  e.stopPropagation();
                                                  handleDragOver(e, grandchild.id);
                                                }
                                              }}
                                              onDragLeave={(e) => !linkEditMode && handleDragLeave(e, grandchild.id)}
                                              onDrop={(e) => {
                                                if (!linkEditMode) {
                                                  e.stopPropagation();
                                                  handleDrop(e, grandchild.id);
                                                }
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (linkEditMode && linkEditSourceId !== grandchild.id) {
                                                  handleChangeLinkParent(grandchild.id);
                                                } else if (!draggedProblemId && !linkEditMode) {
                                                  handleSelectProblem(grandchild);
                                                }
                                              }}
                                            >
                                              <div className={`
                                                relative p-3 rounded-lg border bg-white shadow-sm transition-all w-48
                                                ${dropTargetId === grandchild.id && draggedProblemId !== grandchild.id
                                                  ? 'border-green-500 border-dashed shadow-lg ring-2 ring-green-200'
                                                  : selectedProblem?.id === grandchild.id 
                                                    ? 'border-green-500 shadow-md' 
                                                    : 'border-green-200 hover:border-green-400'}
                                              `}>
                                                {/* Link Edit Button */}
                                                <button
                                                  onClick={(e) => handleStartLinkEdit(e, grandchild.id)}
                                                  className={`absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded transition-all text-xs z-10 ${
                                                    linkEditSourceId === grandchild.id
                                                      ? 'bg-blue-500 text-white scale-110'
                                                      : 'bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600'
                                                  }`}
                                                  title="부모 문제 변경"
                                                >
                                                  🔗
                                                </button>
                                                        
                                                        <div className="flex items-center gap-2">
                                                          <span className="text-sm">🌿</span>
                                                          <div className="flex-1 min-w-0 pr-6">
                                                            <div className="text-xs font-medium text-gray-700 truncate">{grandchild.title}</div>
                                                            <div className="text-xs text-gray-400">D{grandchild.difficulty}</div>
                                                          </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* List View */
                      filteredProblems.map((problem) => {
                        // Get all linked problems (both derived and explicitly linked)
                        const childProblems = problems.filter(p => p.parentProblemId === problem.id);
                        const explicitLinkedProblems = problem.linkedProblems
                          ? problems.filter(p => 
                              problem.linkedProblems.includes(p.id) && 
                              p.parentProblemId !== problem.id  // Exclude if already in childProblems
                            )
                          : [];
                        
                        // Combine all linked problems
                        const allLinkedProblems = [...childProblems, ...explicitLinkedProblems];
                        
                        const parentProblem = problem.parentProblemId 
                          ? problems.find(p => p.id === problem.parentProblemId)
                          : null;
                        const isExpanded = expandedProblems.has(problem.id);
                        const hasLinkedProblems = allLinkedProblems.length > 0;

                        return (
                          <div key={problem.id}>
                            {/* Main Problem Card */}
                            <div
                              className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                                selectedProblem?.id === problem.id
                                  ? "bg-blue-50 border-blue-600"
                                  : "bg-white border-gray-200"
                              } ${problem.isGenerated ? 'ml-4 border-l-4 border-l-green-400' : ''}`}
                              onClick={() => handleSelectProblem(problem)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                {/* Expand/Collapse Button (always reserve space) */}
                                <div className="w-6 flex-shrink-0 flex items-center justify-center">
                                  {hasLinkedProblems && !problem.isGenerated && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpanded(problem.id);
                                      }}
                                      className="text-gray-500 hover:text-gray-700 transition-transform"
                                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                    >
                                      ▶
                                    </button>
                                  )}
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="text-sm font-medium text-gray-800">{problem.title}</h3>
                                    {problem.isGenerated && (
                                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                                        🤖 AI
                                      </Badge>
                                    )}
                                    <Badge className={`text-xs ${getDifficultyColor(problem.difficulty)} border`}>
                                      D{problem.difficulty}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-xs text-gray-500 mb-1">{problem.category}</p>
                                  
                                  {/* Parent Problem Info */}
                                  {parentProblem && (
                                    <p className="text-xs text-blue-600 mb-1">
                                      ↳ Derived from: <span className="font-medium">{parentProblem.title}</span>
                                    </p>
                                  )}
                                  
                                  {/* Linked Problems Summary */}
                                  {hasLinkedProblems && !problem.isGenerated && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleExpanded(problem.id);
                                        }}
                                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                                      >
                                        {isExpanded ? '▼' : '▶'} {allLinkedProblems.length} Linked Problems
                                      </button>
                                      {childProblems.length > 0 && (
                                        <span className="text-xs text-gray-400">
                                          ({childProblems.length} derived)
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Actions */}
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-gray-400 text-right">
                                    {problem.updatedAt.toLocaleDateString()}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProblem(problem.id);
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Expanded Linked Problems - Hierarchical Tree View */}
                            {isExpanded && hasLinkedProblems && !problem.isGenerated && (
                              <div className="mt-2">
                                {/* Recursive function to render problem hierarchy */}
                                {(() => {
                                  const renderProblemTree = (parentId: string, depth: number = 0): JSX.Element[] => {
                                    // Find all direct children of this parent
                                    const directChildren = problems.filter(p => p.parentProblemId === parentId);
                                    
                                    // Sort by difficulty
                                    const sortedChildren = directChildren.sort((a, b) => a.difficulty - b.difficulty);
                                    
                                    return sortedChildren.map((child, idx) => {
                                      const hasGrandchildren = problems.some(p => p.parentProblemId === child.id);
                                      const isChildExpanded = expandedProblems.has(child.id);
                                      
                                      return (
                                        <div key={child.id} className="relative">
                                          {/* Tree connector lines */}
                                          {depth > 0 && (
                                            <div 
                                              className="absolute left-0 top-0 bottom-0 w-px bg-green-200"
                                              style={{ left: `${(depth - 1) * 24 + 8}px` }}
                                            />
                                          )}
                                          
                                          {/* Problem card */}
                                          <div
                                            className={`relative mb-2`}
                                            style={{ marginLeft: `${depth * 24 + 8}px` }}
                                          >
                                            {/* Horizontal connector */}
                                            {depth >= 0 && (
                                              <div 
                                                className="absolute top-4 h-px bg-green-200"
                                                style={{ 
                                                  left: '-16px',
                                                  width: '16px'
                                                }}
                                              />
                                            )}
                                            
                                            <div
                                              onClick={() => handleSelectProblem(child)}
                                              className={`p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${
                                                selectedProblem?.id === child.id
                                                  ? "bg-blue-50 border-blue-400 shadow-sm"
                                                  : "bg-white border-gray-200 hover:border-green-300"
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                {/* Expand/Collapse button for children */}
                                                {hasGrandchildren && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleExpanded(child.id);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0"
                                                  >
                                                    {isChildExpanded ? '▼' : '▶'}
                                                  </button>
                                                )}
                                                
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs text-gray-400">
                                                      {'└' + '─'.repeat(depth > 0 ? 1 : 0)}
                                                    </span>
                                                    <span className="text-xs">🌱</span>
                                                    <h4 className="text-xs font-medium text-gray-700 truncate">
                                                      {child.title}
                                                    </h4>
                                                    <Badge className={`text-xs ${getDifficultyColor(child.difficulty)} border flex-shrink-0`}>
                                                      D{child.difficulty}
                                                    </Badge>
                                                    {child.isGenerated && (
                                                      <Badge className="text-xs bg-green-100 text-green-600 border-green-200 flex-shrink-0">
                                                        🤖 AI
                                                      </Badge>
                                                    )}
                                                    {hasGrandchildren && (
                                                      <span className="text-xs text-gray-400">
                                                        ({problems.filter(p => p.parentProblemId === child.id).length} children)
                                                      </span>
                                                    )}
                                                  </div>
                                                  <p className="text-xs text-gray-400 mt-1 ml-6 truncate">{child.category}</p>
                                                </div>
                                                
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteProblem(child.id);
                                                  }}
                                                  className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                                                  title="Delete problem"
                                                >
                                                  🗑️
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Recursively render grandchildren if expanded */}
                                          {isChildExpanded && hasGrandchildren && (
                                            <div className="ml-0">
                                              {renderProblemTree(child.id, depth + 1)}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    });
                                  };
                                  
                                  // Start rendering from current problem's children
                                  return (
                                    <div className="border-l-4 border-green-200 pl-2">
                                      <p className="text-xs font-semibold text-green-700 mb-3 ml-2">
                                        🌳 Problem Hierarchy ({allLinkedProblems.length} total)
                                      </p>
                                      <div className="space-y-1">
                                        {renderProblemTree(problem.id, 0)}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

        {/* Link Manager Dialog */}
        <Dialog open={showLinkManagerDialog} onOpenChange={setShowLinkManagerDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-xl">🔗 문제 링크 관리</DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh] pr-4">
              {linkManagerProblemId && (
                <div className="space-y-4 py-4">
                  {/* Current Problem Info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">현재 문제</h3>
                    <p className="font-medium">{problems.find(p => p.id === linkManagerProblemId)?.title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      난이도: D{problems.find(p => p.id === linkManagerProblemId)?.difficulty}
                    </p>
                  </div>
                  
                  {/* Outgoing Links (from this problem) */}
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">나가는 링크 (이 문제에서 →)</h3>
                    {(() => {
                      const currentProblem = problems.find(p => p.id === linkManagerProblemId);
                      const outgoingLinks = currentProblem?.linkedProblems || [];
                      
                      if (outgoingLinks.length === 0) {
                        return <p className="text-sm text-gray-500 italic">링크가 없습니다</p>;
                      }
                      
                      return (
                        <div className="space-y-2">
                          {outgoingLinks.map((targetId) => {
                            const targetProblem = problems.find(p => p.id === targetId);
                            if (!targetProblem) return null;
                            
                            return (
                              <div key={targetId} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{targetProblem.title}</p>
                                  <p className="text-xs text-gray-500">난이도: D{targetProblem.difficulty}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteLink(linkManagerProblemId, targetId)}
                                  className="text-xs text-red-600 hover:text-red-800 hover:underline px-3 py-1"
                                >
                                  삭제
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Incoming Links (to this problem) */}
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3">들어오는 링크 (→ 이 문제로)</h3>
                    {(() => {
                      const incomingProblems = problems.filter(p => 
                        p.linkedProblems?.includes(linkManagerProblemId) || 
                        p.id !== linkManagerProblemId && p.parentProblemId === linkManagerProblemId
                      );
                      
                      if (incomingProblems.length === 0) {
                        return <p className="text-sm text-gray-500 italic">링크가 없습니다</p>;
                      }
                      
                      return (
                        <div className="space-y-2">
                          {incomingProblems.map((sourceProblem) => (
                            <div key={sourceProblem.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{sourceProblem.title}</p>
                                <p className="text-xs text-gray-500">난이도: D{sourceProblem.difficulty}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteLink(sourceProblem.id, linkManagerProblemId)}
                                className="text-xs text-red-600 hover:text-red-800 hover:underline px-3 py-1"
                              >
                                삭제
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </ScrollArea>
            
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() => setShowLinkManagerDialog(false)}
                variant="outline"
              >
                닫기
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Link Type Selection Dialog */}
        <Dialog open={showLinkDialog} onOpenChange={(open) => {
          setShowLinkDialog(open);
          if (!open) {
            // Reset states when dialog closes
            setDraggedProblemId(null);
            setDropTargetId(null);
            setLinkConcept("");
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">🔗 문제 링크 생성</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Link Information Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                {draggedProblemId && dropTargetId && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 font-semibold text-sm">출발:</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{problems.find(p => p.id === draggedProblemId)?.title || 'Unknown'}</p>
                        <p className="text-xs text-gray-600">
                          난이도: D{problems.find(p => p.id === draggedProblemId)?.difficulty}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <span className="text-2xl text-blue-500">↓</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-semibold text-sm">도착:</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{problems.find(p => p.id === dropTargetId)?.title || 'Unknown'}</p>
                        <p className="text-xs text-gray-600">
                          난이도: D{problems.find(p => p.id === dropTargetId)?.difficulty}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Link Type Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  링크 타입 선택
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'derived', label: '🌱 파생 문제', desc: '도착 문제가 출발 문제로부터 파생됨' },
                    { value: 'prerequisite', label: '📚 선수 학습', desc: '출발 문제를 먼저 풀어야 도착 문제를 풀 수 있음' },
                    { value: 'related', label: '🔗 관련 문제', desc: '비슷한 개념을 다루는 문제들' },
                    { value: 'next', label: '➡️ 다음 문제', desc: '도착 문제가 출발 문제 다음에 추천되는 문제' },
                    { value: 'alternative', label: '🔄 대체 문제', desc: '같은 개념의 다른 난이도 문제' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`
                        flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${linkType === option.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
                      `}
                    >
                      <input
                        type="radio"
                        name="linkType"
                        value={option.value}
                        checked={linkType === option.value}
                        onChange={(e) => setLinkType(e.target.value as any)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Concept/Tag Input */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  개념/태그 (선택사항)
                </label>
                <Input
                  value={linkConcept}
                  onChange={(e) => setLinkConcept(e.target.value)}
                  placeholder="예: 대수학, 기하학, 등차수열..."
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  이 링크와 관련된 수학 개념을 입력하면 학습 경로를 더 잘 구성할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                onClick={() => {
                  setShowLinkDialog(false);
                  setDraggedProblemId(null);
                  setDropTargetId(null);
                  setLinkConcept("");
                }}
                variant="outline"
              >
                취소
              </Button>
              <Button
                onClick={handleCreateLink}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                ✅ 링크 생성
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Problem Editor Dialog (Full Screen Modal) */}
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="!max-w-[98vw] !max-h-[98vh] w-full h-full p-0 overflow-hidden bg-white shadow-2xl">
            <div className="flex flex-col h-full max-h-[98vh]">
              <DialogHeader className="p-6 border-b flex-shrink-0">
                <DialogTitle className="text-2xl font-semibold text-gray-800">
                  {isEditing ? "Edit Problem" : "New Problem"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <div className="w-full space-y-4">
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
              </div>
            </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
