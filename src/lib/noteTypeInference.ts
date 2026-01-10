import { NoteType } from '@/types';

/**
 * Auto-infer note type from content
 * Rules:
 * - Long excerpt / appears to be a quote → Quote
 * - Ends with "?" or starts with why/how/what/when/who → Question  
 * - Contains TODO, action verbs, imperatives, checklist patterns → Action
 * - Default → Idea
 */
export function inferNoteType(content: string): NoteType {
  if (!content.trim()) return 'idea';
  
  const trimmed = content.trim();
  const lower = trimmed.toLowerCase();
  
  // Check for Question patterns
  const questionPatterns = [
    /\?$/, // Ends with question mark
    /^(why|how|what|when|where|who|which|is|are|can|could|would|should|do|does|did)\b/i,
    /^i('m| am)?\s*(wondering|curious|unsure|not sure)/i,
  ];
  
  if (questionPatterns.some(pattern => pattern.test(trimmed))) {
    return 'question';
  }
  
  // Check for Action patterns
  const actionPatterns = [
    /^(todo|to-do|to do)[:.\s]/i,
    /^\s*[-•✓☐□]\s/, // Checklist items
    /^(remember to|don't forget|need to|must|should|will|going to)\b/i,
    /^(try|test|implement|create|build|make|write|read|research|look up|find|check|review)\b/i,
    /^(action|next step|follow up|task)[:.\s]/i,
  ];
  
  if (actionPatterns.some(pattern => pattern.test(trimmed))) {
    return 'action';
  }
  
  // Check for Quote patterns
  const quotePatterns = [
    /^["'""].*["'""]$/, // Starts and ends with quotes
    /^["'""]/, // Starts with a quote mark
    /"[^"]{20,}"/, // Contains a long quoted section
  ];
  
  // Also consider it a quote if it's a long, well-formed sentence
  // that doesn't match other patterns (likely extracted text)
  const isLongExcerpt = trimmed.length > 100 && 
    !lower.includes('i think') && 
    !lower.includes('my thought') &&
    !lower.includes('i wonder') &&
    // Has proper sentence structure (capital letter, period)
    /^[A-Z]/.test(trimmed) &&
    /[.!?]$/.test(trimmed);
  
  if (quotePatterns.some(pattern => pattern.test(trimmed)) || isLongExcerpt) {
    return 'quote';
  }
  
  // Default to Idea
  return 'idea';
}

/**
 * Get placeholder text based on note type
 */
export function getPlaceholderForType(type: NoteType): string {
  switch (type) {
    case 'quote':
      return 'Paste the quote…';
    case 'idea':
      return 'Write your thought…';
    case 'question':
      return 'What are you wondering?';
    case 'action':
      return 'What will you do?';
    default:
      return 'Write your note…';
  }
}

/**
 * Get type-specific styling classes
 */
export function getTypeStyles(type: NoteType, selected: boolean): string {
  const baseStyles = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all';
  
  if (!selected) {
    return `${baseStyles} bg-secondary/50 text-muted-foreground hover:bg-secondary`;
  }
  
  switch (type) {
    case 'quote':
      return `${baseStyles} bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`;
    case 'idea':
      return `${baseStyles} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
    case 'question':
      return `${baseStyles} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300`;
    case 'action':
      return `${baseStyles} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300`;
    default:
      return `${baseStyles} bg-primary/10 text-primary`;
  }
}
