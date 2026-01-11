import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  existingTags?: string[];
  suggestedTags?: string[];
  placeholder?: string;
  className?: string;
}

export function TagInput({ 
  tags, 
  onChange, 
  existingTags = [], 
  suggestedTags = [],
  placeholder = 'Add tag...',
  className 
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get unique suggestions (existing tags + suggested, minus already selected)
  const allSuggestions = [...new Set([...existingTags, ...suggestedTags])]
    .filter(tag => !tags.includes(tag));
  
  const filteredSuggestions = inputValue
    ? allSuggestions.filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase().replace(/^#/, ''))
      )
    : allSuggestions;

  const recentTags = existingTags.slice(-5).filter(tag => !tags.includes(tag));

  const addTag = (tag: string) => {
    const cleanTag = tag.trim().replace(/^#/, '').toLowerCase();
    if (cleanTag && !tags.includes(cleanTag)) {
      onChange([...tags, cleanTag]);
    }
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Handle # shortcut for quick tag entry
  useEffect(() => {
    if (inputValue.startsWith('#') && inputValue.includes(' ')) {
      const tagPart = inputValue.split(' ')[0];
      addTag(tagPart);
    }
  }, [inputValue]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('space-y-2', className)}>
      {/* Tag chips and input */}
      <div 
        className="flex flex-wrap items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md border border-input bg-transparent cursor-text focus-within:ring-1 focus-within:ring-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 pl-2 pr-1 py-0.5 text-xs font-normal"
          >
            #{tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] border-0 h-6 p-0 text-sm focus-visible:ring-0 bg-transparent"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="p-2 rounded-lg border border-border bg-popover shadow-md space-y-2">
          {/* Recent tags */}
          {!inputValue && recentTags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Recent tags</p>
              <div className="flex flex-wrap gap-1">
                {recentTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2 py-0.5 text-xs rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested tags for this book */}
          {suggestedTags.length > 0 && !inputValue && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Suggested for this book</p>
              <div className="flex flex-wrap gap-1">
                {suggestedTags.filter(t => !tags.includes(t)).slice(0, 5).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Autocomplete matches */}
          {inputValue && filteredSuggestions.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Matching tags</p>
              <div className="flex flex-wrap gap-1">
                {filteredSuggestions.slice(0, 8).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2 py-0.5 text-xs rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state with popular tag suggestions */}
          {!inputValue && recentTags.length === 0 && suggestedTags.length === 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Popular tags</p>
              <div className="flex flex-wrap gap-1">
                {['important', 'favorite', 'key-insight', 'to-revisit', 'actionable'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2 py-0.5 text-xs rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Press Enter to add • Type #tag for quick entry
      </p>
    </div>
  );
}
