// CSV Export Utility for Problems
import { Problem } from './supabase';

/**
 * Convert problems to CSV format
 */
export function convertProblemsToCSV(problems: Problem[]): string {
  if (problems.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Title',
    'Content',
    'Solution',
    'Difficulty',
    'Difficulty Label',
    'Category Level 1',
    'Category Level 2',
    'Category Level 3',
    'Category Path',
    'Level',
    'Age Range',
    'XP',
    'Tags',
    'Diagram URL',
    'Linked Problems',
    'Parent Problem ID',
    'Is Generated',
    'AI Confidence',
    'Concepts',
    'Source',
    'License',
    'Is Reviewed',
    'Created At',
    'Updated At',
  ];

  // Create CSV rows
  const rows = problems.map((problem) => {
    return [
      escapeCsvValue(problem.id),
      escapeCsvValue(problem.title),
      escapeCsvValue(problem.content),
      escapeCsvValue(problem.solution || ''),
      problem.difficulty,
      getDifficultyLabel(problem.difficulty),
      escapeCsvValue(problem.category_level1 || ''),
      escapeCsvValue(problem.category_level2 || ''),
      escapeCsvValue(problem.category_level3 || ''),
      escapeCsvValue(problem.category_path || ''),
      escapeCsvValue(problem.level || ''),
      escapeCsvValue(problem.age_range || ''),
      problem.xp || 0,
      escapeCsvValue(problem.tags?.join('; ') || ''),
      escapeCsvValue(problem.diagram_image_url || ''),
      escapeCsvValue(problem.linked_problem_ids?.join('; ') || ''),
      escapeCsvValue(problem.parent_problem_id || ''),
      problem.is_generated ? 'Yes' : 'No',
      problem.ai_confidence || '',
      escapeCsvValue(problem.concepts?.join('; ') || ''),
      escapeCsvValue(problem.source || ''),
      escapeCsvValue(problem.license || ''),
      problem.is_reviewed ? 'Yes' : 'No',
      escapeCsvValue(problem.created_at || ''),
      escapeCsvValue(problem.updated_at || ''),
    ].join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Escape CSV values (handle commas, quotes, newlines)
 */
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Trigger browser download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'problems.csv') {
  // Create blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Get difficulty label from number
 */
function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 3) return 'Easy';
  if (difficulty <= 6) return 'Medium';
  if (difficulty <= 9) return 'Hard';
  return 'Olympiad';
}

/**
 * Export all problems to CSV
 */
export function exportProblemsToCSV(problems: Problem[], filename?: string) {
  const csvContent = convertProblemsToCSV(problems);
  
  if (!csvContent) {
    alert('No problems to export');
    return;
  }

  const defaultFilename = `mathcomm_problems_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, filename || defaultFilename);
}

/**
 * Export filtered problems to CSV
 */
export function exportFilteredProblemsToCSV(
  allProblems: Problem[],
  filters: {
    category?: string;
    difficulty?: string;
    searchQuery?: string;
  }
) {
  let filtered = allProblems;

  // Apply category filter
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter((p) =>
      p.category_path?.toLowerCase().includes(filters.category!.toLowerCase())
    );
  }

  // Apply difficulty filter
  if (filters.difficulty && filters.difficulty !== 'all') {
    filtered = filtered.filter((p) => {
      if (filters.difficulty === 'easy') return p.difficulty <= 3;
      if (filters.difficulty === 'medium')
        return p.difficulty >= 4 && p.difficulty <= 6;
      if (filters.difficulty === 'hard')
        return p.difficulty >= 7 && p.difficulty <= 9;
      if (filters.difficulty === 'olympic') return p.difficulty === 10;
      return true;
    });
  }

  // Apply search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.category_path?.toLowerCase().includes(query) ||
        p.id.includes(query)
    );
  }

  const filename = `mathcomm_problems_filtered_${new Date().toISOString().split('T')[0]}.csv`;
  exportProblemsToCSV(filtered, filename);
}

