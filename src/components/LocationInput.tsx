import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Clock, Hash, FileText } from 'lucide-react';
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

export function LocationInput({ 
  value, 
  onChange, 
  bookFormat,
  compact = false,
  className 
}: LocationInputProps) {
  const isAudiobook = bookFormat === 'audiobook';

  if (compact) {
    // Compact mode: single row with most relevant fields
    return (
      <div className={`flex gap-2 ${className}`}>
        {isAudiobook ? (
          <>
            <div className="flex-1">
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="0:00:00"
                  value={value.timestamp || ''}
                  onChange={(e) => onChange({ ...value, timestamp: e.target.value })}
                  className="pl-8 h-9 text-sm bg-background"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="relative">
                <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Chapter"
                  value={value.chapter || ''}
                  onChange={(e) => onChange({ ...value, chapter: e.target.value })}
                  className="pl-8 h-9 text-sm bg-background"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-28">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">#</span>
                <Input
                  placeholder="e.g. 42"
                  value={value.page || ''}
                  onChange={(e) => {
                    // Auto-clean p42 -> 42
                    let val = e.target.value.replace(/^p\.?\s*/i, '');
                    onChange({ ...value, page: val });
                  }}
                  className="pl-7 h-9 text-sm bg-background"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="relative">
                <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. Ch 3"
                  value={value.chapter || ''}
                  onChange={(e) => onChange({ ...value, chapter: e.target.value })}
                  className="pl-8 h-9 text-sm bg-background"
                />
              </div>
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
                placeholder="Chapter 5"
                value={value.chapter || ''}
                onChange={(e) => onChange({ ...value, chapter: e.target.value })}
                className="h-9 text-sm bg-background"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                Page
              </Label>
              <Input
                placeholder="42"
                type="number"
                value={value.page || ''}
                onChange={(e) => onChange({ ...value, page: e.target.value })}
                className="h-9 text-sm bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                Chapter
              </Label>
              <Input
                placeholder="Chapter 3"
                value={value.chapter || ''}
                onChange={(e) => onChange({ ...value, chapter: e.target.value })}
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
