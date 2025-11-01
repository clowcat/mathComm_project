// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL or Anon Key is missing. Database features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Problem {
  id: string;
  title: string;
  content: string;
  solution?: string;
  difficulty: number;  // 1-10
  category_level1?: number;  // INTEGER ID from categories table
  category_level2?: number;  // INTEGER ID from categories table
  category_level3?: number;  // INTEGER ID from categories table
  category_path?: string;
  level?: string;  // "Beginner", "Intermediate", etc.
  age_range?: string;  // "8-9", "9-11", etc.
  xp?: number;
  tags?: string[];
  diagram_image_url?: string;
  linked_problem_ids?: string[];
  parent_problem_id?: string;
  is_generated?: boolean;
  ai_confidence?: number;
  concepts?: string[];
  source?: string;
  license?: string;
  is_reviewed?: boolean;
  reviewer_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  nickname?: string;
  current_level?: number;
  total_xp?: number;
  ranking_points?: number;
  tier?: string;
  title?: string;
  current_streak?: number;
  longest_streak?: number;
  problems_solved?: number;
  problems_attempted?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Submission {
  id: string;
  user_id: string;
  problem_id: string;
  solution_text: string;
  solution_html?: string;
  answer_value?: string;
  status: 'pending' | 'correct' | 'incorrect' | 'partial';
  score?: number;
  xp_earned?: number;
  feedback?: string;
  hints_used?: number;
  xp_penalty?: number;
  time_spent_seconds?: number;
  attempt_number?: number;
  submitted_at?: string;
}

// Helper Functions
export const problemsAPI = {
  // Get all problems
  async getAll() {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Problem[];
  },

  // Get problem by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Problem;
  },

  // Create problem
  async create(problem: Omit<Problem, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('problems')
      .insert([problem])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase create error:', error);
      throw new Error(`Failed to create problem: ${error.message || JSON.stringify(error)}`);
    }
    return data as Problem;
  },

  // Update problem
  async update(id: string, problem: Partial<Problem>) {
    const { data, error } = await supabase
      .from('problems')
      .update({ ...problem, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Failed to update problem: ${error.message || JSON.stringify(error)}`);
    }
    return data as Problem;
  },

  // Delete problem
  async delete(id: string) {
    const { error } = await supabase
      .from('problems')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Filter problems
  async filter(filters: {
    difficulty?: number[];
    category?: string;
    level?: string;
    isGenerated?: boolean;
  }) {
    let query = supabase.from('problems').select('*');

    if (filters.difficulty && filters.difficulty.length > 0) {
      query = query.in('difficulty', filters.difficulty);
    }

    if (filters.category) {
      query = query.ilike('category_path', `%${filters.category}%`);
    }

    if (filters.level) {
      query = query.eq('level', filters.level);
    }

    if (filters.isGenerated !== undefined) {
      query = query.eq('is_generated', filters.isGenerated);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Problem[];
  },
};

// Utility: Convert difficulty number to label
export function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 3) return 'Easy';
  if (difficulty <= 6) return 'Medium';
  if (difficulty <= 9) return 'Hard';
  return 'Olympiad';
}

// Utility: Calculate XP from difficulty
export function calculateXP(difficulty: number): number {
  return difficulty * 50;
}

// Utility: Convert category path to tags
export function categoryToTags(categoryPath: string): string[] {
  if (!categoryPath) return [];
  return categoryPath.split(' > ').map(c => c.trim());
}

// Problem Relationships API
export const problemRelationshipsAPI = {
  // Create a relationship between two problems
  async create(
    sourceProblemId: string,
    targetProblemId: string,
    relationshipType: 'prerequisite' | 'derived' | 'related' | 'next' | 'alternative',
    options?: {
      concept?: string;
      description?: string;
      sequenceOrder?: number;
      priority?: number;
      strength?: number;
    }
  ) {
    const { data, error } = await supabase
      .from('problem_relationships')
      .insert([{
        source_problem_id: sourceProblemId,
        target_problem_id: targetProblemId,
        relationship_type: relationshipType,
        concept: options?.concept,
        description: options?.description,
        sequence_order: options?.sequenceOrder || 0,
        priority: options?.priority || 0,
        strength: options?.strength || 0.5,
        is_ai_generated: true,
        is_approved: true,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create problem relationship:', error);
      throw new Error(`Failed to create relationship: ${error.message || JSON.stringify(error)}`);
    }
    return data;
  },

  // Get all relationships for a problem
  async getBySourceProblem(sourceProblemId: string) {
    const { data, error } = await supabase
      .from('problem_relationships')
      .select('*')
      .eq('source_problem_id', sourceProblemId);
    
    if (error) throw error;
    return data;
  },

  // Get derived problems (children)
  async getDerivedProblems(parentProblemId: string) {
    const { data, error } = await supabase
      .from('problem_relationships')
      .select(`
        *,
        target_problem:problems!target_problem_id(*)
      `)
      .eq('source_problem_id', parentProblemId)
      .eq('relationship_type', 'derived');
    
    if (error) throw error;
    return data;
  },
};

