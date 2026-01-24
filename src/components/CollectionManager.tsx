import { useState } from 'react';
import { Collection } from '@/types';
import { useCollections, useCollectionMutations } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Trash2, Edit, Library, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

interface CollectionManagerProps {
  selectedCollectionId?: string;
  onSelectCollection?: (collectionId: string | undefined) => void;
}

export function CollectionManager({
  selectedCollectionId,
  onSelectCollection,
}: CollectionManagerProps) {
  const { data: collections = [], isLoading } = useCollections();
  const { create, update, remove } = useCollectionMutations();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const isMutating = create.isLoading || update.isLoading || remove.isLoading;

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ 
        name: name.trim(), 
        description: description.trim() || undefined 
      });
      toast.success('Collection created');
      setName('');
      setDescription('');
      setIsAddOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create collection');
    }
  };

  const handleUpdate = async () => {
    if (!editingCollection || !name.trim()) return;
    try {
      await update.mutateAsync({ 
        id: editingCollection.id, 
        updates: { 
          name: name.trim(), 
          description: description.trim() || undefined 
        } 
      });
      toast.success('Collection updated');
      setEditingCollection(null);
      setName('');
      setDescription('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update collection');
    }
  };

  const openEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setName(collection.name);
    setDescription(collection.description || '');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Collections</Label>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-1">
        {isLoading ? (
          <p className="text-xs text-muted-foreground py-2">Loading collections...</p>
        ) : collections.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No collections yet. Create one to group related notes.
          </p>
        ) : (
          collections.map(collection => (
            <div key={collection.id} className="flex items-center group">
              <Button
                variant={selectedCollectionId === collection.id ? 'secondary' : 'ghost'}
                size="sm"
                className="flex-1 justify-start gap-2 h-8"
                onClick={() => onSelectCollection?.(
                  selectedCollectionId === collection.id ? undefined : collection.id
                )}
              >
                <Library className="w-4 h-4" />
                <span className="truncate">{collection.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {collection.noteIds.length}
                </span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(collection)} className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => remove.mutate(collection.id, { onError: () => toast.error('Failed to delete collection') })}
                    className="text-destructive focus:text-destructive gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Add Collection Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Collection name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Philosophy, Best Quotes, To Research"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this collection for?"
                className="resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={!!editingCollection} onOpenChange={(open) => !open && setEditingCollection(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Collection name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Collection name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this collection for?"
                className="resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingCollection(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!name.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
