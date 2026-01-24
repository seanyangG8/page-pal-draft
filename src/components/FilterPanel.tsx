import { useState } from 'react';
import { NoteType, Book } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Quote, Lightbulb, HelpCircle, CheckCircle, X } from 'lucide-react';

interface FilterState {
  bookId?: string;
  noteType?: string;
  folderId?: string;
  tags: string[];
}

interface FilterPanelProps {
  books: Book[];
  allTags: string[];
  onFilterChange: (filters: FilterState) => void;
  activeFilters: FilterState;
}

const noteTypes: { type: NoteType; icon: typeof Quote; label: string }[] = [
  { type: 'quote', icon: Quote, label: 'Quotes' },
  { type: 'idea', icon: Lightbulb, label: 'Ideas' },
  { type: 'question', icon: HelpCircle, label: 'Questions' },
  { type: 'action', icon: CheckCircle, label: 'Actions' },
];

export function FilterPanel({ books, allTags, onFilterChange, activeFilters }: FilterPanelProps) {
  const toggleTag = (tag: string) => {
    const tags = activeFilters.tags.includes(tag)
      ? activeFilters.tags.filter(t => t !== tag)
      : [...activeFilters.tags, tag];
    onFilterChange({ ...activeFilters, tags });
  };

  const clearFilters = () => {
    onFilterChange({ bookId: undefined, noteType: undefined, folderId: undefined, tags: [] });
  };

  const hasActiveFilters = activeFilters.bookId || activeFilters.noteType || activeFilters.tags.length > 0;

  return (
    <div className="p-4 rounded-lg border bg-card/50 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Book filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Book:</span>
          <Select 
            value={activeFilters.bookId || 'all'} 
            onValueChange={(v) => onFilterChange({ ...activeFilters, bookId: v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="All books" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All books</SelectItem>
              {books.map(book => (
                <SelectItem key={book.id} value={book.id}>{book.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Type:</span>
          <div className="flex gap-1">
            {noteTypes.map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                variant={activeFilters.noteType === type ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1"
                onClick={() => onFilterChange({ 
                  ...activeFilters, 
                  noteType: activeFilters.noteType === type ? undefined : type 
                })}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Clear button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1">
            <X className="w-3 h-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Tags:</span>
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={activeFilters.tags.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
