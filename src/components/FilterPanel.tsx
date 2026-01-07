import { useState } from 'react';
import { NoteType, Book, SavedFilter } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Filter, ChevronDown, Save, X, Quote, Lightbulb, 
  HelpCircle, CheckCircle, BookOpen, Tag, Calendar
} from 'lucide-react';

export interface FilterState {
  bookIds: string[];
  types: NoteType[];
  tags: string[];
  dateRange?: { start: Date; end: Date };
}

interface FilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  books: Book[];
  allTags: string[];
  savedFilters: SavedFilter[];
  onSaveFilter: (name: string, filters: FilterState) => void;
  onLoadFilter: (filter: SavedFilter) => void;
  onDeleteSavedFilter: (id: string) => void;
}

const noteTypes: { type: NoteType; icon: typeof Quote; label: string }[] = [
  { type: 'quote', icon: Quote, label: 'Quotes' },
  { type: 'idea', icon: Lightbulb, label: 'Ideas' },
  { type: 'question', icon: HelpCircle, label: 'Questions' },
  { type: 'action', icon: CheckCircle, label: 'Actions' },
];

export function FilterPanel({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  books,
  allTags,
  savedFilters,
  onSaveFilter,
  onLoadFilter,
  onDeleteSavedFilter,
}: FilterPanelProps) {
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const toggleType = (type: NoteType) => {
    const types = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types });
  };

  const toggleBook = (bookId: string) => {
    const bookIds = filters.bookIds.includes(bookId)
      ? filters.bookIds.filter(id => id !== bookId)
      : [...filters.bookIds, bookId];
    onFiltersChange({ ...filters, bookIds });
  };

  const toggleTag = (tag: string) => {
    const tags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags });
  };

  const clearFilters = () => {
    onFiltersChange({ bookIds: [], types: [], tags: [] });
  };

  const handleSaveFilter = () => {
    if (!saveFilterName.trim()) return;
    onSaveFilter(saveFilterName.trim(), filters);
    setSaveFilterName('');
    setShowSaveInput(false);
  };

  const hasActiveFilters = filters.bookIds.length > 0 || filters.types.length > 0 || filters.tags.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Notes
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
                Saved Filters
                <ChevronDown className="w-4 h-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-1">
                {savedFilters.map(sf => (
                  <div key={sf.id} className="flex items-center gap-2 group">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 justify-start h-8"
                      onClick={() => onLoadFilter(sf)}
                    >
                      {sf.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => onDeleteSavedFilter(sf.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Note Types */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Quote className="w-3 h-3" />
              Note Types
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {noteTypes.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    filters.types.includes(type)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Books */}
          {books.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="w-3 h-3" />
                Books
              </Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {books.map(book => (
                  <div key={book.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`book-${book.id}`}
                      checked={filters.bookIds.includes(book.id)}
                      onCheckedChange={() => toggleBook(book.id)}
                    />
                    <label 
                      htmlFor={`book-${book.id}`}
                      className="text-sm cursor-pointer truncate flex-1"
                    >
                      {book.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Tag className="w-3 h-3" />
                Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          {/* Save filter */}
          {hasActiveFilters && (
            showSaveInput ? (
              <div className="flex gap-2 w-full">
                <Input
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                  placeholder="Filter name..."
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSaveFilter}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSaveInput(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => setShowSaveInput(true)}
              >
                <Save className="w-4 h-4" />
                Save current filter
              </Button>
            )
          )}
          
          <div className="flex gap-2 w-full">
            <Button variant="ghost" className="flex-1" onClick={clearFilters}>
              Clear all
            </Button>
            <Button className="flex-1" onClick={() => onOpenChange(false)}>
              Apply filters
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
