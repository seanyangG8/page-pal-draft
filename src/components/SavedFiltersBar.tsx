import { useState } from 'react';
import { Book, Folder, NoteType } from '@/types';
import { useSavedFilters, useSavedFilterMutations } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, Filter } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useFolders } from '@/api/hooks';

type FilterState = {
  bookId?: string;
  noteType?: string;
  folderId?: string;
  tags: string[];
};

interface SavedFiltersBarProps {
  activeFilters: FilterState;
  onApply: (filters: FilterState) => void;
  books: Book[];
  folders?: Folder[];
}

export function SavedFiltersBar({ activeFilters, onApply, books }: SavedFiltersBarProps) {
  const { data: savedFilters = [], isLoading } = useSavedFilters();
  const { create, remove } = useSavedFilterMutations();
  const { data: folderData = [] } = useFolders();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const hasActive =
    !!activeFilters.bookId ||
    !!activeFilters.noteType ||
    !!activeFilters.folderId ||
    (activeFilters.tags?.length ?? 0) > 0;

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({
        name: name.trim(),
        filters: {
          bookIds: activeFilters.bookId ? [activeFilters.bookId] : undefined,
          types: activeFilters.noteType ? [activeFilters.noteType as NoteType] : undefined,
          folderIds: activeFilters.folderId ? [activeFilters.folderId] : undefined,
          tags: activeFilters.tags,
        },
      });
      toast.success('Filter saved');
      setName('');
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save filter');
    }
  };

  const applyFilter = (id: string) => {
    const sf = savedFilters.find((f) => f.id === id);
    if (!sf) return;
    onApply({
      bookId: sf.filters.bookIds?.[0],
      noteType: sf.filters.types?.[0],
      folderId: sf.filters.folderIds?.[0],
      tags: sf.filters.tags || [],
    });
    toast.success(`Applied "${sf.name}"`);
  };

  const deleteFilter = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success('Filter removed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove filter');
    }
  };

  const bookLabel = (id?: string) => books.find((b) => b.id === id)?.title || 'Any book';
  const folderLabel = (id?: string) => folderData.find((f) => f.id === id)?.name || 'Any folder';

  return (
    <div className="p-3 rounded-lg border bg-card/40 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="w-4 h-4" />
          Saved filters
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 h-8"
          onClick={() => setDialogOpen(true)}
          disabled={!hasActive}
        >
          <Save className="w-4 h-4" />
          Save current
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading saved filters...</p>
      ) : savedFilters.length === 0 ? (
        <p className="text-xs text-muted-foreground">No saved filters yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {savedFilters.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-1 bg-secondary/60 border border-border/60 rounded-full px-2 py-1 text-xs"
            >
              <button
                onClick={() => applyFilter(f.id)}
              className="flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                title={`${bookLabel(f.filters.bookIds?.[0])}${
                  f.filters.types?.[0] ? ` • ${f.filters.types[0]}` : ''
                }${f.filters.folderIds?.[0] ? ` • ${folderLabel(f.filters.folderIds[0])}` : ''}${
                  (f.filters.tags?.length ?? 0) > 0 ? ` • ${f.filters.tags?.join(', ')}` : ''
                }`}
              >
                <Badge variant="secondary" className="h-5 px-2">
                  {f.name}
                </Badge>
              </button>
              <button
                onClick={() => deleteFilter(f.id)}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Delete saved filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Save current filters
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this filter"
              autoFocus
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Book: {bookLabel(activeFilters.bookId)}</p>
              <p>Type: {activeFilters.noteType || 'Any type'}</p>
              <p>Folder: {folderLabel(activeFilters.folderId)}</p>
              <p>Tags: {activeFilters.tags.length ? activeFilters.tags.join(', ') : 'Any tags'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
