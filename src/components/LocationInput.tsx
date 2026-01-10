import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, FileText, Minus, Plus } from 'lucide-react';
import { BookFormat } from '@/types';

export interface LocationData {
  page?: string;
  chapter?: string;
  section?: string;
  timestamp?: string;
  freeform?: string;
}

interface LocationInputProps {
  value: LocationData;
  onChange: (value: LocationData) => void;
  bookFormat: BookFormat;
  compact?: boolean;
  className?: string;
}

// Smart parsing function to handle various input formats
function parseSmartInput(input: string): Partial<LocationData> {
  const result: Partial<LocationData> = {};
  let remaining = input.trim();
  
  // Extract page number: p42, p.42, page 42, pg42, etc.
  const pageMatch = remaining.match(/(?:^|\s)(?:p\.?|page\s*|pg\.?\s*)(\d+)/i);
  if (pageMatch) {
    result.page = pageMatch[1];
    remaining = remaining.replace(pageMatch[0], ' ');
  }
  
  // Extract chapter: ch3, ch.3, chapter 3, etc.
  const chapterMatch = remaining.match(/(?:^|\s)(?:ch\.?\s*|chapter\s*)(\d+|\w+)/i);
  if (chapterMatch) {
    result.chapter = `Ch ${chapterMatch[1]}`;
    remaining = remaining.replace(chapterMatch[0], ' ');
  }
  
  // Extract timestamp: 1:23:45 or 1:23
  const timestampMatch = remaining.match(/\d{1,2}:\d{2}(:\d{2})?/);
  if (timestampMatch) {
    result.timestamp = timestampMatch[0];
    remaining = remaining.replace(timestampMatch[0], ' ');
  }
  
  return result;
}

export function LocationInput({ 
  value, 
  onChange, 
  bookFormat,
  compact = false,
  className 
}: LocationInputProps) {
  const isAudiobook = bookFormat === 'audiobook';
  
  // Handle page stepper
  const handlePageStep = useCallback((delta: number) => {
    const currentPage = parseInt(value.page || '0', 10);
    const newPage = Math.max(1, currentPage + delta);
    onChange({ ...value, page: String(newPage) });
  }, [value, onChange]);
  
  // Handle smart paste/input for page field
  const handlePageInput = useCallback((inputValue: string) => {
    // Check if this looks like a combined input (has both page and chapter markers)
    if (/(?:p\.?|page|pg\.?)\s*\d+.*(?:ch\.?|chapter)/i.test(inputValue) ||
        /(?:ch\.?|chapter).*(?:p\.?|page|pg\.?)\s*\d+/i.test(inputValue)) {
      const parsed = parseSmartInput(inputValue);
      onChange({ 
        ...value, 
        page: parsed.page || value.page,
        chapter: parsed.chapter || value.chapter,
        timestamp: parsed.timestamp || value.timestamp
      });
      return;
    }
    
    // Clean simple page input: p42 -> 42, p.42 -> 42
    let cleanedValue = inputValue.replace(/^(?:p\.?|page\s*|pg\.?\s*)/i, '');
    onChange({ ...value, page: cleanedValue });
  }, [value, onChange]);
  
  // Handle smart paste/input for chapter field
  const handleChapterInput = useCallback((inputValue: string) => {
    // Check if this looks like a combined input
    if (/(?:p\.?|page|pg\.?)\s*\d+/i.test(inputValue)) {
      const parsed = parseSmartInput(inputValue);
      onChange({ 
        ...value, 
        page: parsed.page || value.page,
        chapter: parsed.chapter || value.chapter,
        timestamp: parsed.timestamp || value.timestamp
      });
      return;
    }
    
    onChange({ ...value, chapter: inputValue });
  }, [value, onChange]);

  if (compact) {
    // Compact mode: single row with labels and most relevant fields
    return (
      <div className={`flex gap-3 ${className}`}>
        {isAudiobook ? (
          <>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Timestamp
              </Label>
              <Input
                placeholder="0:00:00"
                value={value.timestamp || ''}
                onChange={(e) => onChange({ ...value, timestamp: e.target.value })}
                className="h-9 text-sm bg-background"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Chapter
              </Label>
              <Input
                placeholder="Ch 3"
                value={value.chapter || ''}
                onChange={(e) => handleChapterInput(e.target.value)}
                className="h-9 text-sm bg-background"
              />
            </div>
          </>
        ) : (
          <>
            <div className="w-32 space-y-1">
              <Label className="text-xs text-muted-foreground">Page</Label>
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-8 shrink-0"
                  onClick={() => handlePageStep(-1)}
                  disabled={!value.page || parseInt(value.page, 10) <= 1}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  placeholder="42"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={value.page || ''}
                  onChange={(e) => handlePageInput(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (/(?:p\.?|page|pg\.?|ch\.?|chapter)/i.test(pasted)) {
                      e.preventDefault();
                      handlePageInput(pasted);
                    }
                  }}
                  className="h-9 text-sm bg-background text-center px-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-8 shrink-0"
                  onClick={() => handlePageStep(1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Chapter
              </Label>
              <Input
                placeholder="Ch 3"
                value={value.chapter || ''}
                onChange={(e) => handleChapterInput(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  if (/(?:p\.?|page|pg\.?)\s*\d+/i.test(pasted)) {
                    e.preventDefault();
                    handleChapterInput(pasted);
                  }
                }}
                className="h-9 text-sm bg-background"
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // Full mode: all fields with labels
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-2 gap-3">
        {isAudiobook ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Timestamp
              </Label>
              <Input
                placeholder="1:23:45"
                value={value.timestamp || ''}
                onChange={(e) => onChange({ ...value, timestamp: e.target.value })}
                className="h-9 text-sm bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                Chapter
              </Label>
              <Input
                placeholder="Ch 3"
                value={value.chapter || ''}
                onChange={(e) => handleChapterInput(e.target.value)}
                className="h-9 text-sm bg-background"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Page</Label>
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-8 shrink-0"
                  onClick={() => handlePageStep(-1)}
                  disabled={!value.page || parseInt(value.page, 10) <= 1}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  placeholder="42"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={value.page || ''}
                  onChange={(e) => handlePageInput(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (/(?:p\.?|page|pg\.?|ch\.?|chapter)/i.test(pasted)) {
                      e.preventDefault();
                      handlePageInput(pasted);
                    }
                  }}
                  className="h-9 text-sm bg-background text-center px-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-8 shrink-0"
                  onClick={() => handlePageStep(1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                Chapter
              </Label>
              <Input
                placeholder="Ch 3"
                value={value.chapter || ''}
                onChange={(e) => handleChapterInput(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text');
                  if (/(?:p\.?|page|pg\.?)\s*\d+/i.test(pasted)) {
                    e.preventDefault();
                    handleChapterInput(pasted);
                  }
                }}
                className="h-9 text-sm bg-background"
              />
            </div>
          </>
        )}
      </div>
      
      {!isAudiobook && (
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            Section <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            placeholder="Introduction, Part 2, etc."
            value={value.section || ''}
            onChange={(e) => onChange({ ...value, section: e.target.value })}
            className="h-9 text-sm bg-background"
          />
        </div>
      )}
    </div>
  );
}

// Utility to convert LocationData to a display string
export function formatLocation(data: LocationData): string {
  const parts: string[] = [];
  
  if (data.page) parts.push(`p. ${data.page}`);
  if (data.chapter) parts.push(data.chapter);
  if (data.section) parts.push(data.section);
  if (data.timestamp) parts.push(data.timestamp);
  if (data.freeform && parts.length === 0) parts.push(data.freeform);
  
  return parts.join(', ');
}

// Utility to parse a location string back to LocationData
export function parseLocation(locationString: string): LocationData {
  const data: LocationData = {};
  
  // Try to extract page number
  const pageMatch = locationString.match(/p\.?\s*(\d+)/i);
  if (pageMatch) data.page = pageMatch[1];
  
  // Try to extract timestamp (formats: 1:23, 1:23:45)
  const timestampMatch = locationString.match(/\d{1,2}:\d{2}(:\d{2})?/);
  if (timestampMatch) data.timestamp = timestampMatch[0];
  
  // Try to extract chapter
  const chapterMatch = locationString.match(/ch(apter)?\.?\s*\d+/i);
  if (chapterMatch) data.chapter = chapterMatch[0];
  
  // If we couldn't parse anything, store as freeform
  if (!data.page && !data.timestamp && !data.chapter) {
    data.freeform = locationString;
  }
  
  return data;
}
