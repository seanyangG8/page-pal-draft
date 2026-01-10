import { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { BookOpen } from 'lucide-react';

export interface ChapterData {
  chapter_number: number | null;
  chapter_title: string | null;
  chapter_raw: string | null;
  chapter_display: string;
}

interface ChapterInputProps {
  value: ChapterData;
  onChange: (value: ChapterData) => void;
  className?: string;
  recentChapters?: string[];
  hideLabel?: boolean;
}

// Parse user input into structured chapter data
export function parseChapterInput(input: string): ChapterData {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      chapter_number: null,
      chapter_title: null,
      chapter_raw: null,
      chapter_display: '',
    };
  }
  
  // Regex to detect leading chapter number patterns
  // Matches: "ch 3", "chapter 3", "ch. 3", "3", "03", etc.
  const chapterPattern = /^\s*(?:ch(?:apter)?\.?\s*)?(\d+)\s*(.*)$/i;
  const match = trimmed.match(chapterPattern);
  
  if (match) {
    const chapterNumber = parseInt(match[1], 10);
    let remainder = match[2].trim();
    
    // Remove leading separators: "-", "—", "–", ":", "."
    if (remainder && /^[-—–:.]/.test(remainder)) {
      remainder = remainder.slice(1).trim();
    }
    
    const chapterTitle = remainder || null;
    
    return {
      chapter_number: chapterNumber,
      chapter_title: chapterTitle,
      chapter_raw: input,
      chapter_display: formatChapterDisplay(chapterNumber, chapterTitle),
    };
  }
  
  // No number pattern matched - treat entire input as title
  // (handles "Prologue", "Epilogue", "Introduction", "Part 2", etc.)
  return {
    chapter_number: null,
    chapter_title: trimmed,
    chapter_raw: input,
    chapter_display: trimmed,
  };
}

// Compute canonical display format
export function formatChapterDisplay(
  chapterNumber: number | null,
  chapterTitle: string | null
): string {
  if (chapterNumber !== null && chapterTitle) {
    return `Ch ${chapterNumber} - ${chapterTitle}`;
  }
  if (chapterNumber !== null) {
    return `Ch ${chapterNumber}`;
  }
  if (chapterTitle) {
    return chapterTitle;
  }
  return '';
}

// Convert old string chapter to new ChapterData format
export function migrateChapterString(chapter: string | undefined): ChapterData {
  if (!chapter) {
    return {
      chapter_number: null,
      chapter_title: null,
      chapter_raw: null,
      chapter_display: '',
    };
  }
  return parseChapterInput(chapter);
}

// Convert ChapterData back to a string for storage (backwards compatible)
export function chapterDataToString(data: ChapterData): string {
  return data.chapter_display;
}

export function ChapterInput({ 
  value, 
  onChange, 
  className,
  recentChapters = [],
  hideLabel = false
}: ChapterInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Sync input value with external value
  useEffect(() => {
    // When value changes externally, update input to show raw or display
    if (!isFocused) {
      setInputValue(value.chapter_display || '');
    }
  }, [value.chapter_display, isFocused]);
  
  // Parse and update as user types
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    setInputValue(newInput);
    
    const parsed = parseChapterInput(newInput);
    onChange(parsed);
  }, [onChange]);
  
  // On blur, normalize to canonical display
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Normalize the input to canonical display
    if (value.chapter_display) {
      setInputValue(value.chapter_display);
    }
  }, [value.chapter_display]);
  
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Optionally show raw input on focus for editing
    // For now, keep the display value
  }, []);
  
  // Preview text (only show when typing and different from input)
  const showPreview = useMemo(() => {
    if (!isFocused || !inputValue.trim()) return false;
    // Show preview if the display differs significantly from input
    const parsed = parseChapterInput(inputValue);
    return parsed.chapter_display && parsed.chapter_display !== inputValue.trim();
  }, [isFocused, inputValue]);
  
  const previewText = useMemo(() => {
    if (!inputValue.trim()) return '';
    return parseChapterInput(inputValue).chapter_display;
  }, [inputValue]);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="relative">
        <Input
          placeholder="Ch 3 - Title (optional)"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className="h-9 text-sm bg-background pl-8"
        />
        <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      </div>
      
      {/* Preview - shows canonical format while typing */}
      {showPreview && previewText && (
        <p className="text-xs text-muted-foreground pl-1 animate-fade-in">
          Will display as: <span className="font-medium text-foreground">{previewText}</span>
        </p>
      )}
    </div>
  );
}
